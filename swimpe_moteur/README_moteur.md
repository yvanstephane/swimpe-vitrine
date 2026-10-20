# SWIMPE — MOTEUR D'OFFRES v3 (volet local, multi-sources)

Un robot qui va chercher des offres sur des **sources de confiance** (liste blanche),
écarte les expirées et les doublons, et génère `offres.json` au schéma du site.
Conçu pour tourner tout seul sur **GitHub Actions**.

## LA STRATÉGIE v3.1 (pourquoi c'est plus performant)
1. **Organismes OFFICIELS vérifiés (le cœur)** — connecteur `concours_html`, qui repère
   les offres par mots-clés ET/OU par motif d'URL (`motif_href`) :
   - ✅ **FNE Cameroun — fnecm.org/offres** (ACTIF, vérifié : ~24 offres réelles, liens /offre/…)
   - Fonction publique SN (fonctionpublique.gouv.sn), Fonction publique CI
     (fonctionpublique.gouv.ci), Agence Emploi Jeunes CI, MINFOPRA, PNV, Cameroon Tribune
     → candidats : lancer `--probe` et activer ce qui répond.
2. **Flux RSS sans clé** : ReliefWeb (ACTIF, vérifié) + relais privés très suivis
   (KamerPower, LesOpportunités, CameroonDesks, ConcoursN) — candidats à confirmer à la main.
3. **APIs officielles (clés gratuites)** : ReliefWeb V2 (appname) = le vrai volume ONU/ONG ;
   Jooble = bonus (couverture faible sur nos pays).

L'**ordre dans sources.json = priorité** : en cas de doublon (même titre + organisation),
la source la plus officielle gagne.

## ⚡ LA SONDE : teste tout en une commande (sur ton Mac)
    cd swimpe_moteur
    python3 moteur.py --probe
Elle essaie TOUTES les sources (même inactives) et affiche ✓/✗ avec le nombre d'offres
et un exemple. Ensuite : mets `"actif": true` sur celles qui marchent, et relance
l'extraction. Rien n'est écrit pendant la sonde.

## TESTER / LANCER EN LOCAL
    cd swimpe_moteur
    python3 -m venv .venv && source .venv/bin/activate   # une fois
    pip install -r requirements.txt                       # une fois
    python3 moteur.py --self-test        # test hors-ligne (simulé) : doit afficher "OK"
    python3 moteur.py --probe            # teste les vraies sources, n'écrit rien
    python3 moteur.py --out offres.json  # VRAIE extraction → crée offres.json
Puis copie `offres.json` dans le dossier du site et redéploie.

## LES DEUX CLÉS GRATUITES (à demander une fois, en parallèle)
- **ReliefWeb appname** : https://apidoc.reliefweb.int/parameters#appname
  Format : nom + usage + caractères aléatoires (ex. `swimpe-local-jobs-k7m2x`).
  Reçu par e-mail → `sources.json` → source `reliefweb` → `"appname"` → `actif:true`.
- **Jooble API key** : formulaire https://jooble.org/api/about
  Reçue par e-mail → source `jooble` → `"api_key"` → vérifier que cm/ci/sn sont
  couverts → `actif:true`.

## AJOUTER UNE SOURCE RSS (le plus simple)
Copier le bloc `emploidakar_rss`, changer id/domaine/urls/pays, laisser `actif:false`,
lancer `--probe`, et activer si ✓. Règles : domaine officiel confirmé à la main,
`fenetre_jours` = durée de vie d'une offre sans date limite explicite.

## 📄 AVIS EN PDF — maintenant lisibles
Sur les sources marquées `"lire_pdf": true` (MINFOPRA, BEAC, fonctions publiques, MINESUP,
Cameroon Tribune), quand un lien repéré pointe vers un **PDF**, le moteur le télécharge
(plafonné), en extrait le texte (pypdf) et y lit la **vraie date limite** + un extrait.
Un avis PDF dont la date est passée est écarté. Les PDF *scannés* (images) restent
illisibles : leur carte est quand même créée (titre + lien officiel + fenêtre d'expiration).

## 📬 BOÎTE DE VEILLE — pour ce qu'aucun robot ne lit (CAMTEL, Ecobank, presse, PDF scannés)
Principe : on fait VENIR l'info dans une boîte e-mail dédiée, le moteur la lit et produit
`a_valider.json` — **jamais publié directement** : TU vérifies, puis tu recopies l'offre
dans `offres_manuelles.json` (modèle fourni) → elle est publiée au prochain passage.

Mise en route (15 min, une fois) :
1. Crée une boîte Gmail dédiée, ex. `veille.swimpe@gmail.com` (active la validation en 2 étapes).
2. Sur https://www.google.com/alerts (connecté avec cette boîte), crée ces alertes
   (fréquence « au plus une fois par jour », langue FR) :
   - `CAMTEL recrutement OR "avis de recrutement"`
   - `Ecobank recrutement (Cameroun OR "Côte d'Ivoire" OR Sénégal)`
   - `"avis de recrutement" (Cameroun OR Douala OR Yaoundé)`
   - `"avis de concours" (Sénégal OR "Côte d'Ivoire" OR Cameroun)`
   - `ENEO OR CNPS OR BEAC recrutement Cameroun`
   - `"appel à candidature" jeunes (Dakar OR Abidjan OR Yaoundé)`
3. Abonne cette boîte aux newsletters OFFICIELLES utiles (FNE, agences, LinkedIn
   « alertes emploi » des pages CAMTEL/Ecobank…) — les e-mails qu'on reçoit, on a le droit de les lire.
4. Gmail → Compte → Sécurité → **Mots de passe d'application** → crée-en un, puis :
       export SWIMPE_IMAP_MDP='xxxx xxxx xxxx xxxx'
5. Dans `sources.json` → source `boite_veille` : colle l'adresse dans `imap_utilisateur`
   et mets `actif: true`. (Sur GitHub Actions : ajoute le secret `SWIMPE_IMAP_MDP`.)
6. À chaque exécution : les nouveaux e-mails → candidats dans `a_valider.json`
   (liens Google Alerts désemballés, dédoublonnés, purgés après 45 jours).

### ⚖️ Le VALIDATEUR AUTOMATIQUE (l'humain valide les DOMAINES, le robot valide les OFFRES)
Chaque candidat de veille passe par `domaines_confiance.json` (137 domaines officiels
vérifiés à la main, issus de la bibliothèque des employeurs). Trois bacs :
- 🟢 **AUTO-PUBLIÉ** : le lien (ou l'e-mail de candidature) pointe vers un domaine de
  confiance → le moteur lit la PAGE OFFICIELLE, extrait titre/pays/date limite, publie
  (`ajoute_par: "veille-auto"`). Un e-mail de candidature n'est retenu que s'il est sur
  un domaine de confiance (jamais un gmail/yahoo).
- 🔴 **ALERTE SOSIE** : domaine qui IMITE un officiel (camtel-recrutement.cm,
  fnecn.org, camtel.com…) → signalé `alerte_arnaque_probable` dans a_valider.json,
  jamais publié. Matière pour la page Anti-arnaque.
- 🟡 **À VALIDER** : domaine inconnu → reste dans a_valider.json avec diagnostic.
  Tu vérifies le domaine UNE fois ; s'il est officiel, ajoute une ligne dans
  `domaines_confiance.json` ("domaine.xx": "Nom de l'organisme") → tout son flux
  devient automatique ensuite. Sinon : recopie ponctuelle dans offres_manuelles.json.

## CE QU'IL NE FAIT PAS (volontairement)
- Il n'aspire PAS le web : aucune source hors liste blanche.
- Il ne tamponne pas « vérifié » n'importe quoi : la confiance vient du domaine de la
  source ; chaque offre garde son lien d'origine (`source_url`).
- Offres sans fraîcheur garanties : jamais — date limite réelle (détectée dans le texte
  quand elle existe : « Closing date… », « Date limite… ») ou fenêtre d'expiration auto.

## METTRE EN AUTOMATIQUE (GitHub Actions)
1. Mets ce dossier `swimpe_moteur/` (avec `.github/workflows/moteur.yml`) dans un dépôt GitHub.
2. Le workflow tourne toutes les 6 h (+ bouton « Run workflow ») et commit `offres.json`
   s'il a changé.
3. BRANCHER AU SITE : héberger le site sur **Cloudflare Pages connecté à ce dépôt** →
   chaque commit met le site à jour automatiquement. (Sinon : re-glisser offres.json à la main.)

## DÉPANNAGE RAPIDE
- `✗ reliefweb_rss … 404` → ouvre https://reliefweb.int/jobs, menu **RSS** en bas de page,
  copie l'URL exacte et colle-la en premier dans `urls`.
- `✗ … appname manquant` / `clé Jooble manquante` → voir « Les deux clés gratuites ».
- `0 offres` sur une source ✓ → normal selon les périodes ; le cron réessaie toutes les 6 h.
