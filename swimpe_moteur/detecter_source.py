#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SWIMPE — DÉTECTEUR DE SOURCE
Tu donnes un lien, il reconnaît le type de site et génère l'entrée prête pour sources.json.

Usage :
    python3 detecter_source.py "https://employeur.exemple.com/jobs"
    python3 detecter_source.py "https://..." --pays Cameroun --type emploi
    python3 detecter_source.py "https://..." --ajouter      # ajoute direct dans sources.json (actif:false)
    python3 detecter_source.py --self-test                  # tests hors-ligne, n'écrit rien

Après l'ajout : lance « python3 moteur.py --probe » pour tester, puis passe la source
à "actif": true si elle répond, et pousse sur GitHub (ou demande à Claude de le faire).
Rien n'est publié tant que la source n'est pas active ET que son domaine est de confiance.
"""
import sys, os, re, json, argparse
from urllib.parse import urlparse

ICI = os.path.dirname(os.path.abspath(__file__))
PAYS_CONNUS = ["Cameroun", "Côte d'Ivoire", "Sénégal"]

try:
    import requests
except Exception:
    requests = None

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
      "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "fr,en;q=0.8"}

MOTS_VIDES = {"www", "jobs", "careers", "emploi", "offres", "recrutement", "fr", "en"}


def _slug(s):
    s = re.sub(r"[^a-z0-9]+", "_", (s or "").lower()).strip("_")
    return s or "source"


def domaine_de(url):
    try:
        return (urlparse(url).hostname or "").replace("www.", "").lower()
    except Exception:
        return ""


def _id_depuis(host):
    # fnecm.org -> fnecm ; apply.workable.com -> workable…
    parts = [p for p in host.split(".") if p not in ("com", "org", "net", "int", "gov", "cm", "ci", "sn", "fr")]
    parts = [p for p in parts if p not in MOTS_VIDES] or parts
    return _slug(parts[0] if parts else host)


# ---------------------------------------------------------------------------
# 1) DÉTECTION PAR MOTIF D'URL (sans réseau) — les ATS connus
# ---------------------------------------------------------------------------
def detecter_par_motif(url, pays, type_offre):
    host = domaine_de(url)
    p = urlparse(url)
    chemin = p.path or "/"

    # Workday : <tenant>.wdNN.myworkdayjobs.com/<...>/<site>/...
    if "myworkdayjobs.com" in host:
        tenant = host.split(".myworkdayjobs.com")[0]  # ex. worldvision.wd1
        # le « site » est le 1er segment de chemin qui n'est pas une locale (xx-XX)
        site = ""
        for seg in [s for s in chemin.split("/") if s]:
            if re.fullmatch(r"[a-z]{2}-[A-Z]{2}", seg):
                continue
            site = seg
            break
        return {
            "id": _slug(tenant.split(".")[0]) + "_workday",
            "actif": False, "type": "workday_api",
            "domaine": host,
            "libelle": "%s — portail officiel Workday" % tenant.split(".")[0].title(),
            "organisation_defaut": tenant.split(".")[0].title(),
            "tenant": tenant, "site": site or "Careers",
            "recherche": pays or "", "pays": pays or "Autre",
            "fenetre_jours": 21, "limite": 20,
        }, "Portail Workday détecté (tenant « %s », site « %s »)." % (tenant, site)

    # Workable : apply.workable.com/<compte>/...
    if host == "apply.workable.com":
        compte = next((s for s in chemin.split("/") if s), "")
        return {
            "id": _slug(compte) + "_workable",
            "actif": False, "type": "workable_api",
            "domaine": "apply.workable.com/" + compte,
            "libelle": "%s — portail officiel Workable" % compte.replace("-", " ").title(),
            "organisation_defaut": compte.replace("-", " ").title(),
            "compte": compte, "pays": pays or "Autre",
            "fenetre_jours": 21, "limite": 25,
        }, "Portail Workable détecté (compte « %s »)." % compte

    # --- MÉTHODE « PORTE DE SERVICE » : portails qui bloquent les robots mais ont une API ---
    # ONU (careers.un.org / Inspira) : un seul connecteur suffit, il couvre tout le Secrétariat
    if host in ("careers.un.org", "inspira.un.org"):
        return {
            "id": "un_careers_api", "actif": False, "type": "un_careers_api",
            "domaine": "careers.un.org", "libelle": "Nations Unies — portail officiel (API careers.un.org)",
            "organisation_defaut": "Nations Unies (Secrétariat)",
            "api_base": "https://careers.un.org/api/public/opening/jo",
            "par_page": 100, "pages_max": 6, "limite": 40,
        }, "Portail ONU détecté : la source « un_careers_api » existe déjà dans sources.json (elle couvre toutes les offres)."

    # Oracle HCM « Candidate Experience » (PNUD/UNFPA « Quantum », banques…) :
    # https://<host>/hcmUI/CandidateExperience/<langue>/sites/<SITE>/...
    if host.endswith(".oraclecloud.com") and "/hcmUI/CandidateExperience/" in chemin:
        m = re.search(r"/CandidateExperience/([a-z]{2})/sites/([^/]+)", chemin)
        langue, site = (m.group(1), m.group(2)) if m else ("en", "CX_1")
        nom = host.split(".")[0]
        return {
            "id": _slug(nom) + "_oracle",
            "actif": False, "type": "oracle_hcm_api",
            "domaine": host,
            "libelle": "%s — portail officiel Oracle HCM (site %s)" % (nom.upper(), site),
            "organisation_defaut": "", "host": "https://" + host, "site": site, "langue": langue,
            "par_page": 100, "pages_max": 3, "fenetre_jours": 30, "limite": 40,
        }, "Portail Oracle HCM détecté (site « %s »). Renseigne organisation_defaut (ex. PNUD)." % site

    # ReliefWeb (reliefweb.int) : API officielle déjà branchée
    if host == "reliefweb.int":
        return {
            "id": "reliefweb_api", "actif": False, "type": "reliefweb_api", "domaine": "reliefweb.int",
            "libelle": "ReliefWeb — API officielle (ONU/OCHA)",
        }, "ReliefWeb détecté : la source API existe déjà dans sources.json."

    # Recruitee : <nom>.recruitee.com
    if host.endswith(".recruitee.com"):
        nom = host.split(".recruitee.com")[0]
        return {
            "id": _slug(nom) + "_recruitee",
            "actif": False, "type": "recruitee_api",
            "domaine": host,
            "libelle": "%s — portail officiel Recruitee" % nom.replace("-", " ").title(),
            "host": "%s://%s" % (p.scheme or "https", host),
            "organisation_defaut": nom.replace("-", " ").title(),
            "fenetre_jours": 21, "limite": 25,
        }, "Portail Recruitee détecté (« %s »)." % nom

    return None, None


# ---------------------------------------------------------------------------
# 2) DÉTECTION PAR LECTURE DE LA PAGE (réseau) — RSS, WordPress, HTML
# ---------------------------------------------------------------------------
def trouver_flux_rss(html, base):
    """Repère un lien de flux RSS/Atom dans le <head> (balise <link rel=alternate>)."""
    liens = []
    for m in re.finditer(r"<link[^>]+>", html, re.I):
        bal = m.group(0)
        if re.search(r'type=["\']application/(rss|atom)\+xml', bal, re.I) or re.search(r'rel=["\']alternate', bal, re.I):
            href = re.search(r'href=["\']([^"\']+)["\']', bal, re.I)
            if href and ("rss" in bal.lower() or "atom" in bal.lower() or "feed" in href.group(1).lower()):
                liens.append(_absolu(href.group(1), base))
    return liens


def _absolu(href, base):
    if href.startswith("http"):
        return href
    p = urlparse(base)
    if href.startswith("/"):
        return "%s://%s%s" % (p.scheme, p.hostname, href)
    return base.rstrip("/") + "/" + href


def deviner_motif_href(html, host):
    """Trouve le motif de lien d'offre le plus fréquent (ex. /offre/, /job/, /vacancy/)."""
    comptes = {}
    for m in re.finditer(r'href=["\']([^"\']+)["\']', html, re.I):
        href = m.group(1)
        chemin = urlparse(href).path if href.startswith("http") else href
        seg = re.match(r"(/[a-z\-]+/)", chemin or "", re.I)
        if seg:
            cle = seg.group(1).lower()
            if any(w in cle for w in ("offre", "job", "emploi", "vacan", "recrut", "poste", "carriere", "career", "annonce", "avis", "concours")):
                comptes[cle] = comptes.get(cle, 0) + 1
    if not comptes:
        return None
    return max(comptes, key=comptes.get)


def detecter_par_page(url, pays, type_offre):
    if requests is None:
        return None, "requests non installé — lance d'abord : pip install -r requirements.txt"
    host = domaine_de(url)
    try:
        r = requests.get(url, headers=UA, timeout=30, verify=True)
        html = r.text if r.ok else ""
    except Exception as e:
        return None, "page illisible (%s)" % e
    if not html:
        return None, "page vide ou inaccessible"

    # a) Flux RSS déclaré dans la page, ou chemins courants
    flux = trouver_flux_rss(html, url)
    for candidat in ["/feed", "/feed/", "/rss", "/rss.xml", "/jobs/rss.xml", "/?feed=rss2"]:
        if len(flux) >= 2:
            break
        u = _absolu(candidat, url)
        try:
            rr = requests.get(u, headers=UA, timeout=20, verify=True)
            deb = rr.content[:200].lstrip()
            if rr.ok and (deb.startswith(b"<?xml") or b"<rss" in deb or b"<feed" in deb):
                flux.append(u)
        except Exception:
            pass
    if flux:
        return {
            "id": _id_depuis(host) + "_rss",
            "actif": False, "type": "rss",
            "domaine": host,
            "libelle": "%s — flux RSS" % host,
            "urls": sorted(set(flux))[:3],
            "fenetre_jours": 21, "limite": 30,
        }, "Flux RSS trouvé : %s" % ", ".join(sorted(set(flux))[:3])

    # b) WordPress REST API ?
    try:
        wp = requests.get("https://%s/wp-json/wp/v2/types" % host, headers=UA, timeout=20, verify=True)
        if wp.ok and "application/json" in wp.headers.get("content-type", ""):
            return {
                "id": _id_depuis(host) + "_wp",
                "actif": False, "type": "wp_rest",
                "domaine": host,
                "libelle": "%s — WordPress (API ouverte)" % host,
                "organisation_defaut": "Via " + host,
                "description_defaut": "Offre relayée par %s. Détails et candidature sur la page officielle." % host,
                "api_base": "https://%s/wp-json/wp/v2" % host,
                "endpoint": "posts  (À CONFIRMER : le bon type d'article, ex. p_annonces)",
                "per_page": 50, "fenetre_jours": 30, "limite": 40,
            }, "Site WordPress détecté — vérifie le bon « endpoint » (liste : /wp-json/wp/v2/types)."
    except Exception:
        pass

    # c) Fallback : site officiel classique (concours_html) avec motif deviné
    motif = deviner_motif_href(html, host) or "/offre/"
    return {
        "id": _id_depuis(host), "actif": False, "type": "concours_html",
        "domaine": host, "libelle": "%s" % host,
        "url": url, "pays": pays or "Autre", "type_offre": type_offre or "emploi",
        "motif_href": motif, "longueur_min_titre": 6,
        "pages_max": 3, "fenetre_jours": 14, "limite": 30, "timeout": 45,
    }, "Site classique — liens d'offres repérés par le motif « %s » (à confirmer avec --probe)." % motif


def detecter(url, pays=None, type_offre=None):
    e, pourquoi = detecter_par_motif(url, pays, type_offre)
    if e:
        return e, pourquoi
    return detecter_par_page(url, pays, type_offre)


# ---------------------------------------------------------------------------
# Ajout dans sources.json
# ---------------------------------------------------------------------------
def ajouter_a_sources(entry, chemin=None):
    chemin = chemin or os.path.join(ICI, "sources.json")
    d = json.load(open(chemin, encoding="utf-8"))
    src = d["sources"]
    base_id = entry["id"]
    ids = {s.get("id") for s in src}
    i = 2
    while entry["id"] in ids:
        entry["id"] = "%s_%d" % (base_id, i); i += 1
    for s in src:
        if s.get("domaine") == entry.get("domaine") and s.get("type") == entry.get("type"):
            return None, "Une source existe déjà pour %s (%s) — rien ajouté." % (entry["domaine"], s.get("id"))
    src.append(entry)
    json.dump(d, open(chemin, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    return entry["id"], "Ajoutée dans sources.json sous l'id « %s » (actif:false)." % entry["id"]


# ---------------------------------------------------------------------------
# Tests hors-ligne
# ---------------------------------------------------------------------------
def self_test():
    ok = True

    def check(nom, cond):
        nonlocal ok
        print("  %s %s" % ("✔" if cond else "✘", nom))
        ok = ok and cond

    e, _ = detecter_par_motif("https://worldvision.wd1.myworkdayjobs.com/en-US/WorldVisionInternational/jobs", "Sénégal", "emploi")
    check("Workday type", e and e["type"] == "workday_api")
    check("Workday tenant", e and e["tenant"] == "worldvision.wd1")
    check("Workday site", e and e["site"] == "WorldVisionInternational")

    e, _ = detecter_par_motif("https://apply.workable.com/giz-kamerun/", "Cameroun", "emploi")
    check("Workable type", e and e["type"] == "workable_api")
    check("Workable compte", e and e["compte"] == "giz-kamerun")
    e, _ = detecter_par_motif("https://estm.fa.em2.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1/job/29178", "Sénégal", "emploi")
    check("Oracle HCM type", e and e["type"] == "oracle_hcm_api" and e["site"] == "CX_1" and e["host"] == "https://estm.fa.em2.oraclecloud.com")
    e, _ = detecter_par_motif("https://careers.un.org/jobSearchDescription/286456?language=en", None, None)
    check("ONU type", e and e["type"] == "un_careers_api")

    e, _ = detecter_par_motif("https://medecinssansfrontiereswaca.recruitee.com/o/poste", None, None)
    check("Recruitee type", e and e["type"] == "recruitee_api")
    check("Recruitee host", e and e["host"] == "https://medecinssansfrontiereswaca.recruitee.com")

    e, _ = detecter_par_motif("https://fnecm.org/offres", "Cameroun", "emploi")
    check("Site classique -> pas d'ATS", e is None)

    flux = trouver_flux_rss('<link rel="alternate" type="application/rss+xml" href="/feed/">', "https://x.org/jobs")
    check("RSS <link> détecté", flux == ["https://x.org/feed/"])

    motif = deviner_motif_href('<a href="/offre/1">a</a><a href="/offre/2">b</a><a href="/apropos">c</a>', "x.org")
    check("motif_href deviné", motif == "/offre/")

    print("\n%s" % ("✅ Tout est vert." if ok else "✘ Des tests ont échoué."))
    return 0 if ok else 1


def main():
    ap = argparse.ArgumentParser(description="Détecteur de source Swimpe")
    ap.add_argument("url", nargs="?", help="Lien du site / portail à scraper")
    ap.add_argument("--pays", default=None, help="Cameroun, Côte d'Ivoire, Sénégal, ou autre")
    ap.add_argument("--type", default="emploi", dest="type_offre", help="emploi, stage ou concours")
    ap.add_argument("--ajouter", action="store_true", help="ajoute l'entrée dans sources.json (actif:false)")
    ap.add_argument("--self-test", action="store_true", help="tests hors-ligne")
    a = ap.parse_args()

    if a.self_test:
        return self_test()
    if not a.url:
        ap.print_help(); return 1

    entry, pourquoi = detecter(a.url, a.pays, a.type_offre)
    if not entry:
        print("❌ Impossible de détecter automatiquement : %s" % pourquoi)
        print("   → On peut la configurer à la main (dis-le à Claude avec le lien).")
        return 1

    print("✅ %s\n" % pourquoi)
    print(json.dumps(entry, ensure_ascii=False, indent=2))
    if a.ajouter:
        _, msg = ajouter_a_sources(entry)
        print("\n%s" % msg)
    else:
        print("\n(Ajoute --ajouter pour l'insérer dans sources.json, ou copie ce bloc à la main.)")
    print("\nEnsuite : python3 moteur.py --probe  → si ✓, passe « actif » à true et pousse sur GitHub.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
