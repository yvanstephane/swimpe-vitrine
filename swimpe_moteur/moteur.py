#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SWIMPE — moteur d'extraction d'offres (volet local) — v3 multi-sources.

Lit UNIQUEMENT des sources de confiance declarees dans sources.json (liste blanche),
extrait les offres, ne garde que les NON EXPIREES, et ecrit offres.json au schema du site.

Connecteurs disponibles :
  - rss           : tout flux RSS/Atom d'une source de confiance (sans cle ni inscription)
  - reliefweb_api : API officielle ReliefWeb V2 (necessite un appname pre-approuve)
  - jooble_api    : API officielle Jooble (cle gratuite par formulaire)
  - html          : page HTML officielle lisible (selecteurs CSS)
  - concours_html : reperage d'avis de concours sur sites officiels

Principes anti-arnaque :
- Aucune source hors liste blanche n'est lue.
- Chaque offre garde son lien source (source_url) et le domaine (source_domaine).
- methode_verif = "auto" : l'offre vient d'une source de confiance, verifiee a la date du jour.
- Les offres expirees sont ecartees ; celles sans date limite recoivent une fenetre
  d'expiration automatique (fenetre_jours) pour garantir la fraicheur.

Usage :
  python3 moteur.py                 # extraction reelle -> ecrit offres.json
  python3 moteur.py --out chemin    # choisir le fichier de sortie
  python3 moteur.py --probe         # SONDE : teste TOUTES les sources (meme inactives), n'ecrit rien
  python3 moteur.py --self-test     # test hors-ligne (donnees simulees), n'ecrit rien
"""

import argparse
import datetime
import hashlib
import html as htmllib
import json
import os
import re
import sys

SCHEMA_VERSION = "1"

# --- dependances externes (installees via requirements.txt) ---
try:
    import requests
except Exception:
    requests = None
try:
    from bs4 import BeautifulSoup
except Exception:
    BeautifulSoup = None

UA = {"User-Agent": "SwimpeBot/1.0 (+https://swimpe.com)"}


def _get(url, source):
    """GET avec User-Agent, timeout et option verify_ssl (pour sites gouv. au certificat cassé)."""
    verify = source.get("verify_ssl", True)
    if verify is False:
        try:
            import urllib3
            urllib3.disable_warnings()
        except Exception:
            pass
    return requests.get(url, timeout=int(source.get("timeout", 30)), headers=UA, verify=verify)


def today():
    return datetime.date.today().isoformat()


def jour(iso):
    """Normalise une date (ISO ou AAAA-MM-JJTHH...) en AAAA-MM-JJ, ou '' si invalide."""
    if not iso:
        return ""
    m = re.match(r"(\d{4}-\d{2}-\d{2})", str(iso))
    return m.group(1) if m else ""


def non_expiree(expire_le):
    return bool(expire_le) and expire_le >= today()


def id_stable(prefixe, lien):
    """ID stable d'une offre (md5 du lien) : ne change pas d'une execution a l'autre."""
    h = hashlib.md5(lien.encode("utf-8", "ignore")).hexdigest()[:10]
    return "%s-%s" % (prefixe, h)


def nettoyer_html(s):
    if not s:
        return ""
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmllib.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def texte_pdf(url, source):
    """Telecharge un avis PDF officiel (taille plafonnee) et extrait le texte
    des premieres pages avec pypdf. Retourne "" si illisible (PDF scanne) ou pypdf absent."""
    try:
        from pypdf import PdfReader
    except Exception:
        return ""  # pypdf non installe : la carte reste valable (lien vers le PDF)
    import io
    try:
        r = _get(url, source)
        r.raise_for_status()
        if len(r.content) > 8_000_000:
            return ""
        lecteur = PdfReader(io.BytesIO(r.content))
        morceaux = []
        for page in lecteur.pages[:4]:
            morceaux.append(page.extract_text() or "")
        return re.sub(r"\s+", " ", " ".join(morceaux)).strip()
    except Exception:
        return ""


# ---------------------------------------------------------------------------
# DETECTIONS (pays, type d'offre, date limite dans un texte)
# ---------------------------------------------------------------------------
PAYS_DETECT = {
    "Cameroun": ["cameroun", "cameroon", "yaound", "douala"],
    "Côte d'Ivoire": ["côte d'ivoire", "cote d'ivoire", "ivory coast", "abidjan"],
    "Sénégal": ["sénégal", "senegal", "dakar"],
}

# Pays ReliefWeb -> libelle Swimpe
PAYS_RW = {"Cameroon": "Cameroun", "Senegal": "Sénégal", "Côte d'Ivoire": "Côte d'Ivoire",
           "Cote d'Ivoire": "Côte d'Ivoire", "Ivory Coast": "Côte d'Ivoire"}


def detecter_pays(texte, pays_cibles):
    t = (texte or "").lower().replace("’", "'")
    for fr, variantes in PAYS_DETECT.items():
        if pays_cibles and fr not in pays_cibles:
            continue
        for v in variantes:
            if v in t:
                return fr
    return ""


def detecter_type(titre, defaut="emploi"):
    t = (titre or "").lower()
    if "concours" in t:
        return "concours"
    if "stag" in t or "intern" in t:
        return "stage"
    if "volont" in t or "volunt" in t or "bénévol" in t or "benevol" in t:
        return "volontariat"
    for k in ("formation", "training", "fellow", "séminaire", "seminaire", "workshop", "bootcamp"):
        if k in t:
            return "formation"
    return defaut


def type_offre_rw(noms_type):
    t = " ".join(noms_type).lower()
    if "intern" in t or "stage" in t:
        return "stage"
    if "volunt" in t or "volont" in t:
        return "volontariat"
    if "training" in t or "formation" in t or "fellow" in t or "workshop" in t or "séminaire" in t or "seminaire" in t:
        return "formation"
    return "emploi"


def _mois_num(s):
    s = (s or "").strip(". ").lower()
    table = [("janv", 1), ("jan", 1), ("fév", 2), ("fev", 2), ("feb", 2), ("mars", 3), ("mar", 3),
             ("avr", 4), ("apr", 4), ("mai", 5), ("may", 5), ("juin", 6), ("juil", 7), ("jun", 6),
             ("jul", 7), ("août", 8), ("aout", 8), ("aug", 8), ("sept", 9), ("sep", 9),
             ("oct", 10), ("nov", 11), ("déc", 12), ("dec", 12)]
    for pref, num in table:
        if s.startswith(pref):
            return num
    return 0


def date_limite_texte(texte):
    """Cherche une date limite ('Closing date: 9 Nov 2026', 'Date limite : 30/11/2026'...)."""
    t = (texte or "").lower()
    # motif « 9 nov 2026 » / « 9 novembre 2026 »
    m = re.search(r"(?:closing date|date limite|deadline|cl[ôo]ture|avant le)\s*[:\-]?\s*"
                  r"(\d{1,2})(?:er)?\s+([a-zéûôA-Z\.]+)\s+(\d{4})", t)
    if m:
        mois = _mois_num(m.group(2))
        if mois:
            try:
                return datetime.date(int(m.group(3)), mois, int(m.group(1))).isoformat()
            except ValueError:
                pass
    # motif « 30/11/2026 » ou « 30-11-2026 »
    m = re.search(r"(?:closing date|date limite|deadline|cl[ôo]ture|avant le)\D{0,12}?"
                  r"(\d{1,2})[/\-\.](\d{1,2})[/\-\.](\d{4})", t)
    if m:
        try:
            return datetime.date(int(m.group(3)), int(m.group(2)), int(m.group(1))).isoformat()
        except ValueError:
            pass
    return ""


def date_rss(s):
    """Date RSS (RFC822) ou Atom (ISO) -> AAAA-MM-JJ."""
    if not s:
        return ""
    s = s.strip()
    try:
        from email.utils import parsedate_to_datetime
        d = parsedate_to_datetime(s)
        if d:
            return d.date().isoformat()
    except Exception:
        pass
    return jour(s)


def _offre(source, oid, type_offre, titre, organisation, pays, ville, domaine,
           description, lien, publie_le, expire_le):
    return {
        "id": oid,
        "domaine_swimpe": "local",
        "type": type_offre,
        "titre": titre,
        "organisation": organisation,
        "pays": pays,
        "ville": ville,
        "domaine": domaine,
        "description": description,
        "comment_postuler": {"mode": "lien", "valeur": lien},
        "publie_le": publie_le,
        "expire_le": expire_le,
        "verifie": True,
        "source_url": lien,
        "source_domaine": source.get("domaine", ""),
        "methode_verif": "auto",
        "verifie_le": today(),
        "ajoute_par": "moteur",
        "profil_international": False,
    }


# ---------------------------------------------------------------------------
# CONNECTEUR RSS/ATOM generique (sans cle, sans inscription)
# ---------------------------------------------------------------------------
def fetch_rss(source, _mock=None):
    """Essaie chaque URL de flux declaree jusqu'a obtenir du XML valide. Retourne bytes/str."""
    if _mock is not None:
        return _mock
    if requests is None:
        raise RuntimeError("Le module 'requests' est requis (pip install -r requirements.txt).")
    urls = source.get("urls") or ([source["url"]] if source.get("url") else [])
    if not urls:
        raise RuntimeError("aucune URL de flux declaree (champ 'urls').")
    derniere = None
    for u in urls:
        try:
            r = _get(u, source)
            r.raise_for_status()
            debut = r.content[:2000].lower()
            if b"<rss" in debut or b"<feed" in debut or b"<?xml" in debut:
                return r.content
            derniere = RuntimeError("reponse non-XML sur %s" % u)
        except Exception as e:
            derniere = e
    raise derniere or RuntimeError("aucune URL de flux n'a repondu")


def parser_flux(donnees):
    """Parse RSS 2.0 ou Atom avec la bibliotheque standard. Retourne une liste d'items."""
    import xml.etree.ElementTree as ET
    if isinstance(donnees, str):
        donnees = donnees.encode("utf-8", "ignore")
        # neutralise une eventuelle declaration d'encodage divergente
        donnees = re.sub(rb'encoding="[^"]+"', b'encoding="utf-8"', donnees, count=1)
    root = ET.fromstring(donnees)
    items = []

    def t(el, balise):
        e = el.find(balise)
        return (e.text or "").strip() if e is not None and e.text else ""

    # RSS 2.0
    for it in root.iter("item"):
        items.append({
            "titre": t(it, "title"),
            "lien": t(it, "link"),
            "desc": t(it, "description"),
            "date": t(it, "pubDate") or t(it, "{http://purl.org/dc/elements/1.1/}date"),
            "cats": [(c.text or "").strip() for c in it.findall("category")],
        })
    if items:
        return items
    # Atom
    NS = "{http://www.w3.org/2005/Atom}"
    for it in root.iter(NS + "entry"):
        lien = ""
        for l in it.findall(NS + "link"):
            if l.get("rel") in (None, "alternate"):
                lien = l.get("href") or lien
        items.append({
            "titre": t(it, NS + "title"),
            "lien": lien,
            "desc": t(it, NS + "summary") or t(it, NS + "content"),
            "date": t(it, NS + "updated") or t(it, NS + "published"),
            "cats": [(c.get("term") or "").strip() for c in it.findall(NS + "category")],
        })
    return items


def map_rss(donnees, source, pays_cibles):
    items = parser_flux(donnees)
    fenetre = int(source.get("fenetre_jours", 21))
    exp_defaut = (datetime.date.today() + datetime.timedelta(days=fenetre)).isoformat()
    offres = []
    for it in items:
        titre = nettoyer_html(it["titre"])[:140]
        lien = (it["lien"] or "").strip()
        if not titre or not lien:
            continue
        desc = nettoyer_html(it["desc"])
        texte = " ".join([titre, desc, " ".join(it["cats"])])
        pays = source.get("pays") or detecter_pays(texte, pays_cibles)
        if not pays:
            continue  # flux mondial : on ne garde que nos pays cibles
        # date limite : trouvee dans le texte, sinon fenetre automatique
        expire = date_limite_texte(texte) or exp_defaut
        if not non_expiree(expire):
            continue
        publie = date_rss(it["date"]) or today()
        description = (desc[:240] + "…") if len(desc) > 240 else (
            desc or "Offre publiée sur la source. Détails et candidature sur la page officielle.")
        offres.append(_offre(
            source, id_stable(source["id"], lien),
            detecter_type(titre, source.get("type_offre", "emploi")),
            titre, source.get("organisation_defaut", ""), pays, "", "",
            description, lien, publie, expire))
        if len(offres) >= int(source.get("limite", 30)):
            break
    return offres


# ---------------------------------------------------------------------------
# CONNECTEUR ReliefWeb (API officielle ONU/OCHA, V2) — appname pre-approuve requis
# ---------------------------------------------------------------------------
def fetch_reliefweb(source, pays_cibles, _mock=None):
    if _mock is not None:
        return _mock
    if requests is None:
        raise RuntimeError("Le module 'requests' est requis (pip install -r requirements.txt).")
    base = source.get("api_base", "https://api.reliefweb.int/v2")
    appname = (source.get("appname") or "").strip()
    if not appname:
        raise RuntimeError(
            "appname ReliefWeb manquant. Depuis le 01/11/2025, ReliefWeb exige un appname "
            "PRE-APPROUVE. Demande-le ici : https://apidoc.reliefweb.int/parameters#appname "
            "puis colle-le dans sources.json (source 'reliefweb', champ \"appname\")."
        )
    url = "%s/jobs?appname=%s" % (base.rstrip("/"), appname)
    body = {
        "filter": {"field": "country", "value": source.get("pays_reliefweb", [])},
        "fields": {"include": ["title", "source.name", "country.name", "city.name",
                               "date.created", "date.closing", "url_alias", "type.name",
                               "career_categories.name"]},
        "limit": source.get("limite", 40),
        "sort": ["date.created:desc"],
    }
    r = requests.post(url, json=body, timeout=30)
    if r.status_code in (401, 403):
        raise RuntimeError(
            "ReliefWeb a refuse l'appname (%s). Verifie qu'il est bien approuve et actif." % r.status_code)
    if r.status_code == 410:
        raise RuntimeError(
            "Endpoint ReliefWeb supprime (410). Verifie api_base (doit etre https://api.reliefweb.int/v2).")
    r.raise_for_status()
    return r.json().get("data", [])


def map_reliefweb(jobs, source):
    offres = []
    for j in jobs:
        f = j.get("fields", {})
        pays = ""
        for c in (f.get("country") or []):
            nom = PAYS_RW.get(c.get("name", ""), c.get("name", ""))
            if nom in PAYS_RW.values():
                pays = nom
                break
        if not pays:
            continue
        expire = jour((f.get("date") or {}).get("closing"))
        if not non_expiree(expire):
            continue
        org = (f.get("source") or [{}])[0].get("name", "")
        ville = (f.get("city") or [{}])[0].get("name", "")
        domaine = (f.get("career_categories") or [{}])[0].get("name", "")
        types = [x.get("name", "") for x in (f.get("type") or [])]
        lien = f.get("url_alias") or ("https://reliefweb.int/node/%s" % j.get("id"))
        offres.append(_offre(
            source, "rw-" + str(j.get("id")), type_offre_rw(types),
            (f.get("title") or "").strip(), org.strip(), pays, ville.strip(), domaine.strip(),
            "Offre publiée via ReliefWeb (ONU/OCHA). Détails et candidature sur la page officielle.",
            lien, jour((f.get("date") or {}).get("created")), expire))
    return offres


# ---------------------------------------------------------------------------
# CONNECTEUR Jooble (API officielle, cle gratuite par formulaire)
# ---------------------------------------------------------------------------
def fetch_jooble(source, _mock=None):
    """Interroge Jooble pour chaque requete declaree. Retourne [(pays, [jobs...]), ...]."""
    if _mock is not None:
        return _mock
    if requests is None:
        raise RuntimeError("Le module 'requests' est requis (pip install -r requirements.txt).")
    cle = (source.get("api_key") or "").strip()
    if not cle:
        raise RuntimeError(
            "cle API Jooble manquante. Demande-la (gratuite) via le formulaire "
            "https://jooble.org/api/about — recue par e-mail — puis colle-la dans "
            "sources.json (source 'jooble', champ \"api_key\").")
    resultats = []
    for req in source.get("requetes", []):
        host = (req.get("host") or "https://jooble.org").rstrip("/")
        r = requests.post("%s/api/%s" % (host, cle),
                          json={"keywords": req.get("mots_cles", ""),
                                "location": req.get("localisation", "")},
                          timeout=30, headers=UA)
        r.raise_for_status()
        resultats.append((req.get("pays", ""), r.json().get("jobs", [])))
    return resultats


def map_jooble(resultats, source):
    fenetre = int(source.get("fenetre_jours", 14))
    exp = (datetime.date.today() + datetime.timedelta(days=fenetre)).isoformat()
    cap = int(source.get("limite", 25))
    offres = []
    for pays, jobs in resultats:
        n_pays = 0
        for jb in jobs:
            if n_pays >= cap:
                break  # limite par pays/requete
            titre = nettoyer_html(jb.get("title", ""))[:140]
            lien = (jb.get("link") or "").strip()
            if not titre or not lien:
                continue
            desc = nettoyer_html(jb.get("snippet", ""))
            description = (desc[:240] + "…") if len(desc) > 240 else (
                desc or "Offre agrégée par Jooble. Détails et candidature sur l'annonce d'origine.")
            offres.append(_offre(
                source, id_stable("jb", lien), detecter_type(titre, "emploi"),
                titre, nettoyer_html(jb.get("company", "")), pays,
                nettoyer_html(jb.get("location", "")), "",
                description, lien, jour(jb.get("updated")) or today(), exp))
            n_pays += 1
    return offres


# ---------------------------------------------------------------------------
# CONNECTEUR VEILLE E-MAIL — pour ce qu'aucun robot ne lit directement :
# recrutements annonces par presse/e-mail (CAMTEL, Ecobank...), PDF scannes, reseaux.
# Principe : une boite dediee recoit Google Alerts + newsletters OFFICIELLES ;
# le moteur la lit (IMAP) et produit des CANDIDATS "a_valider.json" —
# JAMAIS publies directement (anti-arnaque : validation humaine obligatoire).
# ---------------------------------------------------------------------------
def fetch_veille_email(source, _mock=None):
    if _mock is not None:
        return _mock
    import imaplib
    import email as email_mod
    from email.header import decode_header
    hote = source.get("imap_hote", "imap.gmail.com")
    utilisateur = (source.get("imap_utilisateur") or "").strip()
    var = source.get("imap_mdp_env", "SWIMPE_IMAP_MDP")
    mdp = os.environ.get(var, "")
    if not utilisateur or not mdp:
        raise RuntimeError(
            "boite de veille non configuree : renseigne \"imap_utilisateur\" dans sources.json "
            "et exporte le mot de passe d'application : export %s='xxxx xxxx xxxx xxxx' "
            "(Gmail > comptes > mots de passe d'application, necessite la validation en 2 etapes)." % var)

    def dec(s):
        out = ""
        for part, enc in decode_header(s or ""):
            out += part.decode(enc or "utf-8", "ignore") if isinstance(part, bytes) else part
        return out

    M = imaplib.IMAP4_SSL(hote)
    try:
        M.login(utilisateur, mdp)
        M.select(source.get("dossier", "INBOX"))
        typ, donnees = M.search(None, "UNSEEN")
        ids = (donnees[0].split() if donnees and donnees[0] else [])
        ids = ids[-int(source.get("max_messages", 30)):]
        messages = []
        for mid in ids:
            typ, brut = M.fetch(mid, "(RFC822)")
            if typ != "OK" or not brut or not brut[0]:
                continue
            msg = email_mod.message_from_bytes(brut[0][1])
            corps = ""
            for part in msg.walk():
                if part.get_content_type() in ("text/html", "text/plain"):
                    try:
                        corps += part.get_payload(decode=True).decode(
                            part.get_content_charset() or "utf-8", "ignore")
                    except Exception:
                        pass
            messages.append((dec(msg.get("Subject")), dec(msg.get("From")),
                             msg.get("Date", ""), corps))
        return messages
    finally:
        try:
            M.logout()
        except Exception:
            pass


def map_veille_email(messages, source):
    """E-mails de veille -> CANDIDATS a valider (titre, liens depouilles des redirections Google)."""
    from urllib.parse import urlparse, parse_qs, unquote
    candidats = []
    for sujet, de, date_m, corps in messages:
        liens = re.findall(r'https?://[^\s"\'<>()\]]+', corps or "")
        propres, doms = [], set()
        for l in liens:
            if "google." in l and "url?" in l:
                q = parse_qs(urlparse(l).query)
                cible = (q.get("url") or q.get("q") or [""])[0]
                if cible:
                    l = unquote(cible)
            l = l.split("&utm")[0].split("?utm")[0].rstrip(".,;")
            dom = urlparse(l).netloc.lower().replace("www.", "")
            if (not dom or "google." in dom or "gstatic" in dom or "doubleclick" in dom
                    or "unsubscribe" in l.lower() or dom in doms):
                continue
            doms.add(dom)
            propres.append({"lien": l, "domaine": dom})
            if len(propres) >= 8:
                break
        if not propres:
            continue
        candidats.append({
            "sujet": nettoyer_html(sujet)[:160],
            "expediteur": (de or "")[:120],
            "recu_le": date_rss(date_m) or today(),
            "liens": propres,
            "statut": "a_valider",
            "_rappel": "Verifier sur le site OFFICIEL de l'organisme, puis recopier l'offre "
                       "dans offres_manuelles.json si elle est reelle (jamais de publication directe).",
        })
    return candidats


# ---------------------------------------------------------------------------
# CONNECTEUR Recruitee (portails type medecinssansfrontiereswaca.recruitee.com)
# API JSON publique, sans cle : <host>/api/offers/
# ---------------------------------------------------------------------------
def fetch_recruitee(source, _mock=None):
    if _mock is not None:
        return _mock
    if requests is None:
        raise RuntimeError("Le module 'requests' est requis.")
    host = source["host"].rstrip("/")
    r = _get(host + "/api/offers/", source)
    r.raise_for_status()
    return r.json().get("offers", [])


def map_recruitee(offers, source, pays_cibles):
    host = source.get("host", "").rstrip("/")
    fenetre = int(source.get("fenetre_jours", 21))
    exp_defaut = (datetime.date.today() + datetime.timedelta(days=fenetre)).isoformat()
    offres = []
    for o in offers:
        titre = nettoyer_html(o.get("title", ""))[:140]
        lien = (o.get("careers_url") or (host + "/o/" + str(o.get("slug", "")))).strip()
        if not titre or not lien:
            continue
        lieu = " ".join(x for x in [o.get("city", ""), o.get("country", ""),
                                    nettoyer_html(str(o.get("location", "")))] if x)
        pays = source.get("pays") or detecter_pays(titre + " " + lieu, pays_cibles)
        if not pays:
            continue
        expire = jour(o.get("close_at")) or exp_defaut
        if not non_expiree(expire):
            continue
        desc = nettoyer_html(o.get("description", ""))
        description = (desc[:240] + "…") if len(desc) > 240 else (
            desc or "Offre publiée sur le portail officiel de recrutement.")
        offres.append(_offre(
            source, id_stable(source["id"], lien), detecter_type(titre, "emploi"),
            titre, source.get("organisation_defaut", source.get("libelle", "")), pays,
            o.get("city", "") or "", "", description, lien,
            jour(o.get("published_at") or o.get("created_at")) or today(), expire))
        if len(offres) >= int(source.get("limite", 25)):
            break
    return offres


# ---------------------------------------------------------------------------
# CONNECTEUR HTML generique (sites officiels lisibles, ex. pnvcameroun.cm)
# ---------------------------------------------------------------------------
def fetch_html(source, _mock=None):
    if _mock is not None:
        return _mock
    if requests is None:
        raise RuntimeError("Le module 'requests' est requis.")
    r = _get(source["url"], source)
    r.raise_for_status()
    return r.text


def map_html(htmltext, source):
    if BeautifulSoup is None:
        raise RuntimeError("Le module 'beautifulsoup4' est requis pour les sources HTML.")
    sel = source.get("selecteurs", {})
    soup = BeautifulSoup(htmltext, "html.parser")
    offres = []
    for i, carte in enumerate(soup.select(sel.get("carte", "article"))):
        def txt(css):
            el = carte.select_one(css) if css else None
            return re.sub(r"\s+", " ", el.get_text(" ", strip=True)).strip() if el else ""
        titre = txt(sel.get("titre"))
        if not titre:
            continue
        expire = jour(txt(sel.get("expire_le")))
        if not non_expiree(expire):
            continue
        a = carte.select_one(sel.get("lien", "a"))
        lien = a.get("href") if a and a.has_attr("href") else source["url"]
        if lien.startswith("/"):
            from urllib.parse import urljoin
            lien = urljoin(source["url"], lien)
        offres.append(_offre(
            source, id_stable(source["id"], lien + "#" + str(i)),
            source.get("type_offre", "emploi"), titre, txt(sel.get("organisation")),
            source.get("pays", ""), txt(sel.get("ville")), "",
            "Offre publiée sur la source officielle. Détails et candidature sur la page officielle.",
            lien, today(), expire))
    return offres


# ---------------------------------------------------------------------------
# CONNECTEUR CONCOURS (sites officiels + médias d'État : articles/avis)
# ---------------------------------------------------------------------------
CONCOURS_MOTS = ["concours", "recrutement", "avis de concours", "appel à candidature", "formation"]

# Liens de navigation/pied de page frequents a ECARTER (bruit des pages d'accueil)
NOISE = ["votre avis compte", "concours en ligne", "plateforme de recrutement", "carte de",
         "en savoir plus", "lire la suite", "accueil", "connexion", "se connecter",
         "mot de passe", "s'inscrire", "inscrivez-vous", "newsletter", "cookies",
         "mentions légales", "nous contacter", "contactez", "plan du site", "espace candidat",
         "espace membre", "télécharger", "voir plus", "toutes les offres", "tous les concours",
         "qui sommes", "à propos", "foire aux questions"]


def est_bruit(titre):
    t = titre.lower().strip(" |·-—:")
    if t in [n.strip() for n in NOISE]:
        return True
    return any(n in t for n in NOISE)


def fetch_concours(source, _mock=None):
    if _mock is not None:
        return _mock
    if requests is None:
        raise RuntimeError("Le module 'requests' est requis.")
    r = _get(source["url"], source)
    r.raise_for_status()
    return r.text


def map_concours(htmltext, source):
    """Repere les liens d'offres/avis sur une page officielle :
    - par MOTS-CLES dans le titre du lien (mots_cles), et/ou
    - par MOTIF D'URL (motif_href, regex sur le href — ex. "/offre/" pour fnecm.org)."""
    if BeautifulSoup is None:
        raise RuntimeError("Le module 'beautifulsoup4' est requis.")
    from urllib.parse import urljoin
    soup = BeautifulSoup(htmltext, "html.parser")
    mots = [m.lower() for m in source.get("mots_cles", CONCOURS_MOTS)]
    motif = source.get("motif_href", "")
    type_o = source.get("type_offre", "concours")
    long_min = int(source.get("longueur_min_titre", 12 if not motif else 6))
    fenetre = int(source.get("fenetre_jours", 30))
    exp = (datetime.date.today() + datetime.timedelta(days=fenetre)).isoformat()
    if type_o == "concours":
        desc = ("Avis repéré sur une source officielle. Vérifiez les pièces à fournir et la "
                "date limite directement sur l'avis officiel.")
        domaine_txt = "Concours / recrutement"
    else:
        desc = "Offre publiée sur le site officiel. Détails et candidature sur la page officielle."
        domaine_txt = ""
    vus, offres, pdfs_lus = set(), [], 0
    for a in soup.select(source.get("selecteur_lien", "a")):
        titre = re.sub(r"\s+", " ", a.get_text(" ", strip=True)).strip()
        href = a.get("href") if a.has_attr("href") else ""
        if not titre or not href or len(titre) < long_min:
            continue
        if href.strip() in ("", "#") or href.strip().startswith(("#", "javascript:", "mailto:", "tel:")):
            continue
        if est_bruit(titre):
            continue
        retenu = bool(motif and re.search(motif, href))
        if not retenu:
            retenu = any(m in titre.lower() for m in mots)
        if not retenu:
            continue
        lien = urljoin(source["url"], href)
        if lien in vus:
            continue
        vus.add(lien)
        # --- lecture de l'avis PDF officiel (date limite reelle + extrait) ---
        expire_item, desc_item = exp, desc
        if source.get("lire_pdf") and ".pdf" in lien.lower() and pdfs_lus < int(source.get("pdf_max", 5)):
            pdfs_lus += 1
            txt = texte_pdf(lien, source)
            if txt:
                dl = date_limite_texte(titre + " " + txt)
                if dl:
                    expire_item = dl
                extrait = txt[:240].strip()
                if len(extrait) > 60:
                    desc_item = extrait + "… (extrait de l'avis officiel PDF)"
        if not non_expiree(expire_item):
            continue  # l'avis PDF porte une date limite deja passee
        offres.append(_offre(
            source, id_stable(source["id"], lien),
            detecter_type(titre, type_o), titre[:140],
            source.get("libelle", source.get("domaine", "")), source.get("pays", ""), "",
            domaine_txt, desc_item, lien, today(), expire_item))
        if len(offres) >= int(source.get("limite", 15)):
            break
    return offres


# ---------------------------------------------------------------------------
# ORCHESTRATION
# ---------------------------------------------------------------------------
def charger_config(chemin):
    with open(chemin, encoding="utf-8") as fh:
        return json.load(fh)


def charger_offres_manuelles(chemin):
    """Offres ajoutees A LA MAIN (validees par un humain) : fusionnees en priorite."""
    if not chemin:
        return []
    try:
        with open(chemin, encoding="utf-8") as fh:
            data = json.load(fh)
        return [o for o in data.get("offres", []) if non_expiree(o.get("expire_le", ""))]
    except FileNotFoundError:
        return []
    except Exception as e:
        print("  ! offres_manuelles.json illisible: %s" % e, file=sys.stderr)
        return []


def ecrire_a_valider(chemin, nouveaux):
    """Fusionne les candidats de veille avec l'existant (dedup, purge > 45 jours)."""
    anciens = []
    try:
        with open(chemin, encoding="utf-8") as fh:
            anciens = json.load(fh).get("candidats", [])
    except Exception:
        pass
    limite = (datetime.date.today() - datetime.timedelta(days=45)).isoformat()
    vus, fusion = set(), []
    for c in list(nouveaux) + list(anciens):
        premier = c.get("liens", [{}])[0].get("lien", "") if c.get("liens") else ""
        cle = (c.get("sujet", ""), premier)
        if cle in vus or (c.get("recu_le", "") and c["recu_le"] < limite):
            continue
        vus.add(cle)
        fusion.append(c)
    with open(chemin, "w", encoding="utf-8") as fh:
        json.dump({"maj": today(), "candidats": fusion}, fh, ensure_ascii=False, indent=2)
    return len(fusion)


# ---------------------------------------------------------------------------
# VALIDATEUR AUTOMATIQUE DES CANDIDATS DE VEILLE
# Principe : l'humain valide les DOMAINES (une fois, liste domaines_confiance.json),
# le robot valide les OFFRES (a chaque passage). Trois bacs :
#   ok      -> domaine deja verifie : on lit la page OFFICIELLE et on publie
#   sosie   -> domaine qui IMITE un officiel : alerte arnaque, jamais publie
#   inconnu -> reste dans a_valider.json (une validation humaine du domaine suffit
#              pour que tout son flux devienne automatique ensuite)
# ---------------------------------------------------------------------------
def charger_domaines_confiance(chemin):
    try:
        with open(chemin, encoding="utf-8") as fh:
            return json.load(fh).get("domaines", {})
    except Exception:
        return {}


def _lev(a, b):
    """Distance d'edition simple (bornee) pour reperer les quasi-copies de domaines."""
    if abs(len(a) - len(b)) > 2:
        return 99
    prec = list(range(len(b) + 1))
    for i, ca in enumerate(a, 1):
        cour = [i]
        for j, cb in enumerate(b, 1):
            cour.append(min(prec[j] + 1, cour[-1] + 1, prec[j - 1] + (ca != cb)))
        prec = cour
    return prec[-1]


def verifier_domaine(dom, confiance):
    """-> ("ok", domaine_officiel) | ("sosie", officiel_imite) | ("inconnu", "")."""
    dom = (dom or "").lower().strip(". ")
    if not dom:
        return ("inconnu", "")
    for t in confiance:
        if dom == t or dom.endswith("." + t):
            return ("ok", t)
    parts = dom.split(".")
    sld = parts[-2] if len(parts) >= 2 else parts[0]
    if sld in ("www", "mail", "web"):
        return ("inconnu", "")
    for t in confiance:
        tp = t.split(".")
        tsld = tp[-2] if len(tp) >= 2 else tp[0]
        if len(tsld) < 4:
            continue
        if sld == tsld:
            return ("sosie", t)                     # meme nom, autre extension (.cm vs .com)
        if len(tsld) >= 5 and _lev(sld, tsld) == 1:
            return ("sosie", t)                     # quasi-copie (fnecn.org ~ fnecm.org)
        if tsld in sld and sld != tsld:
            return ("sosie", t)                     # nom etendu (camtel-recrutement.cm)
    return ("inconnu", "")


def trier_candidats(candidats, confiance, pays_cibles, mock_pages=None):
    """Trie les candidats de veille : (offres auto-validees, candidats restants annotes)."""
    pseudo = {"timeout": 30}
    fen = (datetime.date.today() + datetime.timedelta(days=21)).isoformat()
    offres_auto, restants = [], []
    for c in candidats:
        verdicts, publie = [], False
        for item in c.get("liens", []):
            dom = item.get("domaine", "")
            statut, officiel = verifier_domaine(dom, confiance)
            if statut == "sosie":
                verdicts.append("🔴 %s ressemble au domaine officiel %s — sosie probable, NE PAS diffuser" % (dom, officiel))
                continue
            if statut != "ok":
                verdicts.append("🟡 domaine inconnu : %s — à vérifier UNE fois puis ajouter à domaines_confiance.json" % dom)
                continue
            lien = item["lien"]
            try:
                if mock_pages is not None:
                    page = mock_pages.get(lien, "")
                elif ".pdf" in lien.lower():
                    page = texte_pdf(lien, pseudo)
                else:
                    r = _get(lien, pseudo)
                    r.raise_for_status()
                    page = r.text
            except Exception as e:
                verdicts.append("🟡 %s est officiel mais la page n'a pas répondu (%s)" % (dom, e))
                continue
            m = re.search(r"<title[^>]*>(.*?)</title>", page or "", re.I | re.S)
            titre = nettoyer_html(m.group(1)) if m else ""
            if not titre:
                titre = re.sub(r"^(alerte google|google alerte?)\s*[:\-]\s*", "",
                               c.get("sujet", ""), flags=re.I).strip()
            texte = nettoyer_html(page or "")
            pays = detecter_pays(" ".join([c.get("sujet", ""), titre, texte[:4000]]), pays_cibles)
            if not pays or not titre:
                verdicts.append("🟡 %s officiel, mais titre/pays cible non détectés sur la page — à confirmer" % dom)
                continue
            expire = date_limite_texte(titre + " " + texte) or fen
            if not non_expiree(expire):
                verdicts.append("🟡 %s : la date limite trouvée est déjà passée" % dom)
                continue
            # e-mail de candidature accepte UNIQUEMENT s'il est sur un domaine de confiance
            mode, valeur = "lien", lien
            for em in re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", texte[:6000]):
                dm = em.split("@")[1].lower()
                if verifier_domaine(dm, confiance)[0] == "ok":
                    mode, valeur = "email", em
                    break
            desc = (texte[:240] + "…") if len(texte) > 240 else (
                texte or "Offre publiée sur le site officiel.")
            organisation = (confiance.get(officiel, "") or "").split("—")[0].strip()[:90]
            o = _offre({"domaine": dom}, id_stable("veille", lien),
                       detecter_type(titre, "emploi"), titre[:140], organisation,
                       pays, "", "", desc, lien, c.get("recu_le", today()), expire)
            o["comment_postuler"] = {"mode": mode, "valeur": valeur}
            o["ajoute_par"] = "veille-auto"
            offres_auto.append(o)
            publie = True
            break  # un lien officiel publié suffit pour ce candidat
        if not publie:
            c2 = dict(c)
            c2["diagnostic"] = verdicts or ["aucun lien exploitable"]
            if any(v.startswith("🔴") for v in verdicts):
                c2["alerte_arnaque_probable"] = True
            restants.append(c2)
    return offres_auto, restants


def lire_source(src, pays_cibles, mock=None):
    """Lit UNE source et retourne ses offres mappees (leve une exception en cas d'echec)."""
    m = (mock or {}).get(src["id"])
    t = src["type"]
    if t == "rss":
        return map_rss(fetch_rss(src, _mock=m), src, pays_cibles)
    if t == "reliefweb_api":
        return map_reliefweb(fetch_reliefweb(src, pays_cibles, _mock=m), src)
    if t == "jooble_api":
        return map_jooble(fetch_jooble(src, _mock=m), src)
    if t == "recruitee_api":
        return map_recruitee(fetch_recruitee(src, _mock=m), src, pays_cibles)
    if t == "html":
        return map_html(fetch_html(src, _mock=m), src)
    if t == "concours_html":
        return map_concours(fetch_concours(src, _mock=m), src)
    raise RuntimeError("type de source inconnu : %s" % t)


def _cle_dedup(o):
    return re.sub(r"\W+", " ", (o["titre"] + " " + o.get("organisation", "")).lower()).strip()


def executer(config, mock=None):
    pays_cibles = config.get("pays_cibles", [])
    # offres validees a la main : prioritaires (gagnent le dedup)
    manuelles = charger_offres_manuelles(config.get("_chemin_offres_manuelles", ""))
    if manuelles:
        print("  · offres manuelles : %d offre(s)" % len(manuelles), file=sys.stderr)
    toutes = list(manuelles)
    a_valider = []
    for src in config.get("sources", []):
        if not src.get("actif"):
            continue
        try:
            if src["type"] == "veille_email":
                cand = map_veille_email(
                    fetch_veille_email(src, _mock=(mock or {}).get(src["id"])), src)
                a_valider += cand
                print("  · %s : %d candidat(s) de veille (a valider, non publies)"
                      % (src["id"], len(cand)), file=sys.stderr)
                continue
            offres = lire_source(src, pays_cibles, mock)
            toutes += offres
            print("  · %s : %d offre(s)" % (src["id"], len(offres)), file=sys.stderr)
        except Exception as e:
            # une source en panne ne casse pas tout le moteur
            print("  ! source %s en erreur: %s" % (src.get("id"), e), file=sys.stderr)
    # tri automatique des candidats de veille : domaine officiel -> publie ;
    # sosie -> alerte ; inconnu -> reste a valider (une validation humaine par domaine)
    if a_valider:
        confiance = charger_domaines_confiance(config.get("_chemin_domaines_confiance", ""))
        if confiance:
            autos, a_valider = trier_candidats(a_valider, confiance, pays_cibles,
                                               mock_pages=(mock or {}).get("_pages"))
            if autos:
                print("  · veille → %d offre(s) AUTO-validée(s) (domaine officiel confirmé)"
                      % len(autos), file=sys.stderr)
            toutes += autos
    # dedup par id PUIS par (titre+organisation) — l'ordre des sources = priorite
    vus_id, vus_cle, uniques = set(), set(), []
    for o in toutes:
        c = _cle_dedup(o)
        if o["id"] in vus_id or (c and c in vus_cle):
            continue
        vus_id.add(o["id"])
        vus_cle.add(c)
        uniques.append(o)
    # on ne garde que les pays cibles
    uniques = [o for o in uniques if not pays_cibles or o["pays"] in pays_cibles]
    return {"maj": today(), "schema": SCHEMA_VERSION, "offres": uniques,
            "_a_valider": a_valider}


def probe(config):
    """Teste TOUTES les sources (meme inactives) sans rien ecrire. A lancer sur le Mac."""
    pays_cibles = config.get("pays_cibles", [])
    print("=== SONDE DES SOURCES (rien n'est écrit) ===")
    ok = []
    for src in config.get("sources", []):
        etat = "ACTIVE" if src.get("actif") else "inactive"
        try:
            if src["type"] == "veille_email":
                cand = map_veille_email(fetch_veille_email(src), src)
                print("  ✓ %-24s [%s] %d candidat(s) de veille (a valider)"
                      % (src["id"], etat, len(cand)))
                if cand:
                    ok.append(src["id"])
                continue
            offres = lire_source(src, pays_cibles)
            exemple = (' — ex: "%s"' % offres[0]["titre"][:60]) if offres else ""
            print("  ✓ %-24s [%s] %d offre(s) pour nos pays%s" % (src["id"], etat, len(offres), exemple))
            if offres:
                ok.append(src["id"])
        except Exception as e:
            print("  ✗ %-24s [%s] %s" % (src["id"], etat, e))
    print("\nSources qui marchent : %s" % (", ".join(ok) if ok else "aucune pour l'instant"))
    print("→ Mets \"actif\": true sur celles qui marchent dans sources.json, puis relance :")
    print("  python3 moteur.py --out offres.json")


# ---------------------------------------------------------------------------
# SELF-TEST (hors-ligne)
# ---------------------------------------------------------------------------
RSS_MOCK = """<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0"><channel><title>Test</title>
<item><title>Chargé(e) de suivi-évaluation — Cameroun</title>
<link>https://exemple.org/jobs/1</link>
<description>Poste basé à Yaoundé, Cameroun. Closing date: 31 Dec 2099</description>
<pubDate>Mon, 13 Oct 2026 08:00:00 +0000</pubDate></item>
<item><title>Logistics Officer — Kenya</title>
<link>https://exemple.org/jobs/2</link>
<description>Based in Nairobi, Kenya.</description>
<pubDate>Mon, 13 Oct 2026 08:00:00 +0000</pubDate></item>
<item><title>Stage communication (EXPIRÉE — doit être écartée)</title>
<link>https://exemple.org/jobs/3</link>
<description>Dakar, Sénégal. Date limite : 30/09/2026</description>
<pubDate>Mon, 01 Sep 2026 08:00:00 +0000</pubDate></item>
<item><title>Volontaire alphabétisation</title>
<link>https://exemple.org/jobs/4</link>
<description>Mission à Thiès, Sénégal, 6 mois.</description>
<pubDate>Wed, 14 Oct 2026 08:00:00 +0000</pubDate></item>
</channel></rss>"""

FNE_MOCK = """<html><body>
<a href="/offres">Voir toutes les offres</a>
<a href="/offre/REF123">R&eacute;ceptionniste</a>
<a href="/offre/REF124">Stagiaire assistant RH</a>
<nav><a href="/contact-nous">Contact</a></nav>
</body></html>"""

VEILLE_MOCK = [
    ("Alerte Google : recrutement CAMTEL",
     "Google Alerts <googlealerts-noreply@google.com>",
     "Mon, 19 Oct 2026 08:00:00 +0000",
     '<a href="https://www.google.com/url?url=https://www.camtel.cm/avis-recrutement-2026&ct=ga">'
     "CAMTEL lance un avis de recrutement de 25 techniciens</a>"),
    ("Newsletter emplois de la semaine",
     "Un relais <info@exemple-relais.org>",
     "Mon, 19 Oct 2026 09:00:00 +0000",
     '<a href="https://jobs-exemple-inconnu.org/offre-123">Offre intéressante</a>'),
    ("Alerte Google : CAMTEL recrute (urgent)",
     "Google Alerts <googlealerts-noreply@google.com>",
     "Mon, 19 Oct 2026 10:00:00 +0000",
     '<a href="https://camtel-recrutement.cm/postuler">Déposez votre dossier ici</a>'),
]

PAGES_MOCK = {
    "https://www.camtel.cm/avis-recrutement-2026":
        "<html><head><title>Avis de recrutement de 25 techniciens réseau — CAMTEL</title></head>"
        "<body>CAMTEL recrute 25 techniciens réseau à Yaoundé (Cameroun). "
        "Dossiers à envoyer à emplois@camtel.cm. Date limite : 31/12/2099.</body></html>",
}

SELF_TEST_MOCK = {
    "boite_veille": VEILLE_MOCK,
    "_pages": PAGES_MOCK,
    "fne_cameroun": FNE_MOCK,
    "reliefweb_rss": RSS_MOCK,
    "reliefweb": [
        {"id": "111", "fields": {
            "title": "Chargé(e) de projet jeunesse",
            "source": [{"name": "UNICEF"}],
            "country": [{"name": "Cameroon"}],
            "city": [{"name": "Yaoundé"}],
            "date": {"created": "2026-10-10T00:00:00+00:00", "closing": "2099-12-31T00:00:00+00:00"},
            "url_alias": "https://reliefweb.int/job/111/charge-projet-jeunesse",
            "type": [{"name": "Job"}],
            "career_categories": [{"name": "Program/Project Management"}]}},
    ],
    "jooble": [
        ("Côte d'Ivoire", [
            {"title": "Assistant comptable", "location": "Abidjan", "company": "PME Exemple",
             "snippet": "Tenue de la comptabilité...", "link": "https://jooble.org/d/1",
             "updated": "2026-10-15T00:00:00"},
        ]),
    ],
}


def self_test(config):
    # on force : reliefweb_rss ACTIF + jooble ACTIF pour tester les mappers, le reste inchange
    cfg = json.loads(json.dumps(config))
    for s in cfg.get("sources", []):
        if s["id"] in SELF_TEST_MOCK:
            s["actif"] = True
        else:
            s["actif"] = False
    res = executer(cfg, mock=SELF_TEST_MOCK)
    a_valider = res.pop("_a_valider", [])
    print("=== SELF-TEST (données simulées, rien n'est écrit) ===")
    print(json.dumps(res, ensure_ascii=False, indent=2))
    noms = [o["titre"] for o in res["offres"]]
    assert all("EXPIR" not in n for n in noms), "ÉCHEC : une offre expirée est passée !"
    assert all(o["pays"] in ("Cameroun", "Côte d'Ivoire", "Sénégal") for o in res["offres"]), \
        "ÉCHEC : une offre hors pays cibles est passée !"
    assert any(o["type"] == "volontariat" for o in res["offres"]), \
        "ÉCHEC : la détection de type (volontariat) n'a pas fonctionné"
    assert any(o["type"] == "stage" and o["source_domaine"] == "fnecm.org" for o in res["offres"]), \
        "ÉCHEC : le repérage par motif_href (FNE) n'a pas fonctionné"
    assert not any("contact" in o["titre"].lower() or "voir toutes" in o["titre"].lower()
                   for o in res["offres"]), "ÉCHEC : un lien de navigation est passé pour une offre !"
    autos = [o for o in res["offres"] if o.get("ajoute_par") == "veille-auto"]
    assert len(autos) == 1 and autos[0]["pays"] == "Cameroun" \
        and autos[0]["comment_postuler"]["mode"] == "email" \
        and autos[0]["comment_postuler"]["valeur"] == "emplois@camtel.cm", \
        "ÉCHEC : le candidat CAMTEL (domaine officiel) n'a pas été AUTO-validé correctement"
    assert len(res["offres"]) == 7, "ÉCHEC : total attendu 7 (6 + 1 auto-validée), obtenu %d" % len(res["offres"])
    assert len(a_valider) == 2, "ÉCHEC : 2 candidats devaient rester à valider, obtenu %d" % len(a_valider)
    assert any(c.get("alerte_arnaque_probable") for c in a_valider), \
        "ÉCHEC : le domaine sosie (camtel-recrutement.cm) n'a pas déclenché l'alerte arnaque"
    assert any("inconnu" in " ".join(c.get("diagnostic", [])) for c in a_valider), \
        "ÉCHEC : le domaine inconnu n'a pas été diagnostiqué"
    print("\nOK : %d offres valides — expirée écartée, hors-pays écartée, types détectés, motif_href OK."
          % len(res["offres"]))
    print("OK veille : CAMTEL (domaine officiel) AUTO-publié avec e-mail officiel · "
          "sosie camtel-recrutement.cm → 🔴 alerte · domaine inconnu → 🟡 à valider.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", default=os.path.join(os.path.dirname(__file__), "sources.json"))
    ap.add_argument("--out", default="offres.json")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--probe", action="store_true",
                    help="teste toutes les sources (meme inactives) sans rien ecrire")
    args = ap.parse_args()

    config = charger_config(args.config)
    config["_chemin_offres_manuelles"] = os.path.join(
        os.path.dirname(os.path.abspath(args.config)), "offres_manuelles.json")
    config["_chemin_domaines_confiance"] = os.path.join(
        os.path.dirname(os.path.abspath(args.config)), "domaines_confiance.json")

    if args.self_test:
        self_test(config)
        return
    if args.probe:
        probe(config)
        return

    res = executer(config)
    a_valider = res.pop("_a_valider", [])
    with open(args.out, "w", encoding="utf-8") as fh:
        json.dump(res, fh, ensure_ascii=False, indent=2)
    print("%d offres valides écrites dans %s (maj %s)." % (len(res["offres"]), args.out, res["maj"]))
    if a_valider:
        chemin_av = os.path.join(os.path.dirname(os.path.abspath(args.out)), "a_valider.json")
        total = ecrire_a_valider(chemin_av, a_valider)
        print("%d candidat(s) de veille en attente dans %s — à vérifier à la main "
              "puis recopier dans offres_manuelles.json." % (total, chemin_av))


if __name__ == "__main__":
    main()
