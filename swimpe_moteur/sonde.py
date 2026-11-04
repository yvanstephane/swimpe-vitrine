#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SWIMPE — LA SONDE : diagnostic d'un lien « illisible » (méthode « porte de service »).

    python3 sonde.py "https://site.exemple/offre/123"

Pour chaque lien, la sonde dit :
  - ce que répond le site (statut HTTP, redirection finale, taille du texte) ;
  - s'il y a un mur anti-robots (Incapsula, Cloudflare, captcha…) ;
  - si la page porte une fiche structurée JSON-LD « JobPosting » (lisible sans navigateur) ;
  - si le site expose une API WordPress (/wp-json) ou un flux RSS ;
  - si l'adresse correspond à une « porte de service » connue (ONU, Workday, ReliefWeb, Oracle HCM,
    Greenhouse, Lever, SmartRecruiters, Workable, Recruitee) et ce que cette porte répond.
Elle n'écrit rien. Lancée depuis GitHub Actions (workflow « sonde »), elle voit le web comme le moteur.
"""
import sys, re, json
from urllib.parse import urlparse, quote

try:
    import requests
except Exception:
    print("Le module 'requests' est requis.")
    sys.exit(1)

UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
      "Accept-Language": "fr,en;q=0.8", "Accept": "text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8"}

MURS = ["incapsula", "_incapsula_", "cf-chl", "cf_chl", "just a moment", "attention required", "captcha",
        "access denied", "request unsuccessful", "perimeterx", "datadome", "akamai", "bot detection"]

PORTES = [
    ("ONU careers.un.org / Inspira", r"careers\.un\.org/(?:jobSearchDescription|jobopening)/(\d+)|inspira\.un\.org/.*?JobOpeningId=(\d+)",
     lambda m, u: "https://careers.un.org/api/public/opening/jo/%s/en" % (m.group(1) or m.group(2))),
    ("Workday", r"^https?://([^.]+)\.wd\d+\.myworkdayjobs\.com/(?:[a-z]{2}-[A-Z]{2}/)?([^/]+)/job/(.+)$",
     lambda m, u: "https://%s/wday/cxs/%s/%s/job/%s" % (urlparse(u).hostname, m.group(1), m.group(2), m.group(3))),
    ("ReliefWeb", r"reliefweb\.int/(?:job|node)/(\d+)",
     lambda m, u: "https://api.reliefweb.int/v2/jobs/%s?appname=swimpe-emplois-cmsnci-k7m2x" % m.group(1)),
    ("Oracle HCM (Quantum…)", r"oraclecloud\.com/hcmUI/CandidateExperience/[^?#]*?/sites/([^/]+)/job/(\d+)",
     lambda m, u: "%s://%s/hcmRestApi/resources/latest/recruitingCEJobRequisitionDetails?expand=all&onlyData=true&finder=ById;siteNumber=%s,Id=%%22%s%%22"
     % (urlparse(u).scheme, urlparse(u).hostname, m.group(1), m.group(2))),
    ("Greenhouse", r"(?:boards|job-boards)\.greenhouse\.io/([^/?#]+)/jobs/(\d+)",
     lambda m, u: "https://boards-api.greenhouse.io/v1/boards/%s/jobs/%s" % (m.group(1), m.group(2))),
    ("Lever", r"jobs\.lever\.co/([^/?#]+)/([0-9a-f-]{36})",
     lambda m, u: "https://api.lever.co/v0/postings/%s/%s" % (m.group(1), m.group(2))),
    ("SmartRecruiters", r"(?:jobs|careers)\.smartrecruiters\.com/([^/?#]+)/(\d+)",
     lambda m, u: "https://api.smartrecruiters.com/v1/companies/%s/postings/%s" % (m.group(1), m.group(2))),
    ("Workable", r"apply\.workable\.com/([^/?#]+)/j/([A-Za-z0-9]+)",
     lambda m, u: "https://apply.workable.com/api/v2/accounts/%s/jobs/%s" % (m.group(1), m.group(2))),
    ("Recruitee", r"^https?://([^/]+\.recruitee\.com)/o/([^/?#]+)",
     lambda m, u: "https://%s/api/offers/%s" % (m.group(1), m.group(2))),
]


def texte_de(html):
    html = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", " ", html, flags=re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html)).strip()


def sonder(url):
    print("=" * 78)
    print("LIEN :", url)
    # 1) la page elle-même
    try:
        r = requests.get(url, headers=UA, timeout=40, allow_redirects=True)
        corps = r.text or ""
        bas = corps.lower()
        print("  statut : %s · type : %s · %d octets" % (r.status_code, r.headers.get("content-type", "?")[:40], len(corps)))
        if r.url != url:
            print("  redirigé vers :", r.url)
        murs = [m for m in MURS if m in bas[:20000]]
        if murs:
            print("  ⛔ MUR ANTI-ROBOTS probable :", ", ".join(murs))
        t = texte_de(corps)
        print("  texte visible : %d caractères · début : %s" % (len(t), t[:140].replace("\n", " ")))
        if re.search(r'application/ld\+json', corps, re.I):
            jp = "jobposting" in bas
            print("  📎 JSON-LD présent%s" % (" — avec une fiche JobPosting ✅ (lisible sans navigateur)" if jp else " (sans JobPosting)"))
        alt = re.findall(r'<link[^>]+type=["\']application/(?:rss|atom)\+xml["\'][^>]*>', corps, re.I)
        if alt:
            print("  📡 flux RSS/Atom annoncé(s) :", len(alt))
        if "/wp-json" in bas or "wp-content" in bas:
            print("  🧩 site WordPress probable → API /wp-json/wp/v2 (porte de service générique)")
        fin = r.url
    except Exception as e:
        print("  ✖ lecture impossible :", e)
        fin = url
    # 2) une porte de service connue ?
    for nom, motif, api in PORTES:
        for u in {url, fin}:
            m = re.search(motif, u)
            if not m:
                continue
            a = api(m, u)
            print("  🚪 porte de service « %s » : %s" % (nom, a))
            try:
                ra = requests.get(a, headers={**UA, "Accept": "application/json"}, timeout=40)
                ok = ra.status_code == 200 and len(ra.content) > 200
                print("     → statut %s · %d octets %s" % (ra.status_code, len(ra.content), "✅ lisible" if ok else "✖"))
                if ok:
                    try:
                        j = ra.json()
                        d = j.get("data") or j if isinstance(j, dict) else {}
                        if isinstance(d, dict) and isinstance(d.get("items"), list) and d["items"]:
                            d = d["items"][0]
                        if isinstance(d, dict):
                            print("     → clés :", ", ".join(list(d.keys())[:40]))
                            for k, v in d.items():
                                if isinstance(v, str) and 0 < len(v) <= 60 and re.search(r"\d{4}-\d\d-\d\d|date", k + v, re.I):
                                    print("        %s = %s" % (k, v))
                    except Exception:
                        pass
            except Exception as e:
                print("     → ✖", e)
            break
    # 3) WordPress : retrouver l'article par son slug
    p = urlparse(fin)
    slug = [s for s in p.path.split("/") if s][-1:]
    if slug:
        base = "%s://%s/wp-json/wp/v2" % (p.scheme, p.hostname)
        try:
            rt = requests.get(base + "/types", headers={**UA, "Accept": "application/json"}, timeout=30)
            if rt.status_code == 200:
                types = rt.json()
                bases = [v.get("rest_base") for v in types.values() if isinstance(v, dict) and v.get("rest_base")]
                print("  🧩 API WordPress ouverte · types :", ", ".join(bases[:12]))
                for b in bases:
                    rs = requests.get("%s/%s?slug=%s&per_page=1" % (base, b, quote(slug[0])), headers={**UA, "Accept": "application/json"}, timeout=30)
                    if rs.status_code == 200 and isinstance(rs.json(), list) and rs.json():
                        it = rs.json()[0]
                        c = (it.get("content") or {}).get("rendered", "") if isinstance(it.get("content"), dict) else ""
                        print("     → trouvé dans « %s » : %s (%d caractères de contenu) ✅" % (b, texte_de((it.get("title") or {}).get("rendered", "")), len(texte_de(c))))
                        break
                else:
                    print("     → aucun type ne connaît le slug « %s »" % slug[0])
        except Exception:
            pass


if __name__ == "__main__":
    liens = [a for a in sys.argv[1:] if a.startswith("http")]
    if not liens:
        print(__doc__)
        sys.exit(1)
    for l in liens:
        sonder(l)
