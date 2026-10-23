const CATS={onu:"ONU & organisations internationales",ong:"ONG internationales & humanitaires",diplo:"Ambassades & coopération internationale",public:"Institutions publiques & concours",prive:"Secteur privé",formations:"Formations & certifications (≤ 1 an)",olympiades:"Olympiades & compétitions académiques",concours:"Concours, prix & programmes jeunes",bourses:"Bourses d'études (émigration)",sport:"Sport (football, olympisme, basket…)",arts:"Arts & Audiovisuel",plateforme:"Plateformes & agrégateurs"};
const SHORT={onu:"ONU",ong:"ONG",diplo:"Ambassades",public:"Public",prive:"Privé",formations:"Formations",olympiades:"Olympiades",concours:"Prix & progr.",bourses:"Bourses",sport:"Sport",arts:"Arts",plateforme:"Plateformes"};
const CDESC={onu:"Agences ONU et coopérations. Recrutement gratuit, souvent via reliefweb.int.",ong:"Humanitaire et développement. Très actives à l'Est et à l'Extrême-Nord.",diplo:"Missions diplomatiques et agences de coopération qui recrutent du personnel local. Chaque mission a UN canal officiel unique — candidature toujours gratuite, et un emploi n'est jamais un visa.",public:"Ministères, écoles, forces, entreprises publiques. Concours centralisés via MINESUP.",prive:"Banques, télécoms, industries. Les grands groupes recrutent via leur portail global.",formations:"Cours et certifications d'un an ou moins, en ligne ou en présentiel local.",olympiades:"Compétitions scolaires et universitaires. La sélection se fait au pays.",concours:"Entrepreneuriat, prix, hackathons et programmes jeunesse.",bourses:"Études à l'étranger. Cible des arnaques — vérifier la source officielle.",sport:"Emploi, détection, formations et bourses sportives. L'accès passe par la fédération ou le comité officiel — jamais par un paiement.",arts:"Cinéma, musique, arts visuels, mode, écriture et médias. Méfiez-vous des faux castings, labels et concours « pay-to-play ».",plateforme:"Relais qui republient des offres. À vérifier au cas par cas."};
const ORDER=["onu","ong","diplo","public","prive","formations","olympiades","concours","bourses","sport","arts","plateforme"];
const D=[
// ONU — local (emplois dans le pays)
["onu","PNUD / UNDP","jobs.undp.org","emploi · stage","officiel","Site pays cm.undp.org, filtrer Cameroon.","local"],
["onu","UNICEF","jobs.unicef.org","emploi · stage","officiel","Postes Yaoundé, Maroua, Bertoua.","local"],
["onu","OMS / WHO","careers.who.int","emploi · stage","officiel","Bureau pays WCO Cameroun.","local"],
["onu","PAM / WFP","wfp.org","emploi · stage","officiel","Yaoundé, Douala, Maroua.","local"],
["onu","FAO","jobs.fao.org","emploi · consultance","officiel","Représentation Cameroun.","local"],
["onu","HCR / UNHCR","unhcr.org","emploi · stage","officiel","Est et Extrême-Nord.","local"],
["onu","UNFPA","cameroon.unfpa.org","emploi · stage","officiel","Section vacancies du site pays.","local"],
["onu","OIM / IOM","iom.int","emploi · stage","officiel","Via Impactpool et recruit.iom.int.","local"],
["onu","OIT / ILO","jobs.ilo.org","emploi · stage","officiel","Bureau Yaoundé.","local"],
["onu","UNESCO","careers.unesco.org","emploi · stage","officiel","Bureau Yaoundé.","local"],
["onu","ONU Femmes","unwomen.org","emploi","officiel","Back-end commun avec jobs.undp.org.","local"],
["onu","UNOPS","jobs.unops.org","emploi","officiel","Postes réservés camerounais fréquents.","local"],
["onu","OCHA","careers.un.org","emploi · stage","officiel","Relayé sur reliefweb.int.","local"],
["onu","Volontaires ONU (UNV)","unv.org","volontariat","officiel","National et international ; app.unv.org.","local"],
["onu","Coordination ONU Cameroun","cameroon.un.org","emploi · stage","officiel","Relaie les offres des agences.","local"],
["onu","Banque mondiale","worldbank.org","emploi · stage","officiel","Bureau Yaoundé.","local"],
["onu","BAD / AfDB","afdb.org","emploi · stage","officiel","Programme Young Professionals.","local"],
["onu","Union Européenne (Délégation)","eeas.europa.eu","emploi local","officiel","Offres sur la page de la délégation.","local"],
["onu","GIZ (coopération allemande)","giz.de","emploi · stage","officiel","Via apply.workable.com/giz-kamerun.","local"],
["onu","AFD (coopération française)","afd.fr","emploi · stage","officiel","Page lafd-recrute.","local"],
["onu","Enabel (coopération belge)","enabel.be","emploi · consultance","officiel","Présence Cameroun au cas par cas.","local"],
["onu","CICR / ICRC","icrc.org","emploi · stage","officiel","Délégation Afrique centrale à Yaoundé.","local"],
["onu","ReliefWeb (OCHA)","reliefweb.int","relais humanitaire","officiel","Seules ONG/agences accréditées y publient.","local"],
["onu","UN Global Marketplace","ungm.org","marchés / consultances","officiel","Officiel pour les consultances ONU.","local"],
// ONG — local
["ong","Médecins Sans Frontières (MSF)","msf.org","emploi · stage · volontariat","officiel","National staff Yaoundé / Maroua.","local"],
["ong","Plan International","jobs.plan-international.org","emploi · stage","officiel","Yaoundé, Bamenda, Buea, Garoua, Maroua.","local"],
["ong","Save the Children","savethechildren.net","emploi · consultance","officiel","Présence Cameroun confirmée.","local"],
["ong","CARE International","care.org","emploi · stage","officiel","Recrute régulièrement des stagiaires.","local"],
["ong","Conseil Norvégien Réfugiés (NRC)","nrc.no","emploi","officiel","Maroua, Kousseri, Yaoundé.","local"],
["ong","International Rescue Committee (IRC)","rescue.org","emploi · stage","officiel","Nord-Ouest / Sud-Ouest.","local"],
["ong","ACTED","acted.org","emploi · stage","officiel","Zone Extrême-Nord.","local"],
["ong","Première Urgence (PUI)","premiere-urgence.org","emploi","officiel","Yaoundé, Maroua.","local"],
["ong","Solidarités International","solidarites.org","emploi","officiel","Yaoundé.","local"],
["ong","COOPI","coopi.org","emploi · consultance","officiel","Page pays Cameroun confirmée.","local"],
["ong","Danish Refugee Council (DRC)","drc.ngo","emploi","officiel","Meiganga, Buea, Bertoua.","local"],
["ong","Catholic Relief Services (CRS)","crs.org","emploi","officiel","Cluster Tchad-Cameroun-RCA.","local"],
["ong","World Vision","wvi.org","emploi","officiel","Présence Cameroun.","local"],
["ong","Action Contre la Faim (ACF)","actioncontrelafaim.org","emploi","officiel","Actif Extrême-Nord.","local"],
["ong","Médecins du Monde","medecinsdumonde.org","emploi · volontariat","officiel","Présence Cameroun.","local"],
["ong","Oxfam","westafrica.oxfam.org","emploi · stage","officiel","Bureau Afrique de l'Ouest.","local"],
["ong","Handicap International / HI","hi.org","emploi · stage","officiel","Via apply.workable.com/hi-jobs.","local"],
["ong","INTERSOS","intersos.org","emploi","officiel","Protection, finance.","local"],
["ong","Mercy Corps","mercycorps.org","emploi","officiel","Recrute via Jobvite.","local"],
["ong","Heifer International","heifer.org","emploi","officiel","Projets Cameroun documentés.","local"],
["ong","Baptist Health Services (CBCHS)","cameroonbaptistconvention.org","emploi · stage · volontariat","officiel","Grand employeur santé (Nord-Ouest).","local"],
["ong","Reach Out Cameroon","reachoutcameroon.org","emploi · volontariat","officiel","ONG locale reconnue (Buea).","local"],
["ong","WWF Cameroun","wwf-congobasin.org","emploi","officiel","Environnement.","local"],
["ong","Wildlife Conservation Society","wcs.org","emploi","officiel","Conservation.","local"],
["ong","FHI 360","fhi360.org","emploi","officiel","Santé / développement.","local"],
["ong","Caritas Cameroun","caritas.org","emploi · volontariat","averifier","Recrutement local par diocèse (CODAS).","local"],
["ong","Croix-Rouge Camerounaise","croixrouge-cameroun.org","emploi · volontariat","averifier","Vérifier le domaine avant diffusion.","local"],
["ong","SNV","snv.org","—","risque","A FERMÉ son bureau Cameroun en 2020.","local"],
// PUBLIC — local
["public","MINESUP (Ens. Supérieur)","minesup.gov.cm","concours · bourses","officiel","Hub de TOUS les concours grandes écoles / universités.","local"],
["public","MINFOPRA (Fonction Publique)","minfopra.gov.cm","concours · emploi","averifier","Concours fonction publique. Domaine à confirmer.","local"],
["public","MINSANTE (Santé)","minsante.cm","concours","officiel","Écoles d'infirmiers. Domaine en .cm.","local"],
["public","MINFI (Finances)","minfi.gov.cm","emploi · concours","officiel","Tutelle Douanes, Impôts, Trésor.","local"],
["public","ENAM","enam.cm","concours","averifier","Administration & magistrature. Domaine à confirmer.","local"],
["public","Grandes écoles (ENS, ENSP, IRIC, FMSB)","minesup.gov.cm","concours","officiel","Arrêtés d'ouverture publiés par MINESUP.","local"],
["public","Police Nationale (DGSN)","concours-dgsn.cm","concours","officiel","Inscription en ligne. ⚠️ Sosie : avec tiret.","local"],
["public","Impôts (DGI)","impots.cm","concours","officiel","Concours des régies financières.","local"],
["public","BEAC","beac.int","concours · emploi","officiel","Concours agents CEMAC. Siège Yaoundé.","local"],
["public","CAMAIR-CO","camair-co.cm","emploi","officiel","⚠️ Fausses annonces — vérifier sur le site.","local"],
["public","Port Autonome de Kribi (PAK)","pak.cm","emploi","officiel","Recrutement via le FNE.","local"],
["public","Université de Douala (inscriptions)","systhag-online.cm","concours","officiel","Plateforme SYSTHAG confirmée.","local"],
["public","ENEO (électricité)","eneocameroon.cm","emploi","averifier","⚠️ Arnaques « emplois ENEO ».","local"],
["public","CAMTEL","career.camtel.cm","emploi","averifier","Portail carrières propre.","local"],
["public","CAMPOST","campost.cm","emploi","averifier","Recrutements massifs ponctuels.","local"],
["public","CNPS","cnps.cm","emploi","averifier","Recrutements ponctuels.","local"],
["public","FNE (Fonds National de l'Emploi)","fnecm.org","emploi · placement","officiel","Organisme public de placement.","local"],
["public","JEME (Jeune Métier Emploi)","emploijeune.cm","emploi","averifier","Programme public.","local"],
["public","Institut National Statistique (INS)","ins-cameroun.cm","emploi · stage","averifier","Publie ses propres postes.","local"],
// PRIVE — local
["prive","Afriland First Bank","afrilandfirstbank.com","emploi · stage","averifier","Young Graduate Program.","local"],
["prive","Société Générale Cameroun","societegenerale.cm","emploi · stage","officiel","Via careers.societegenerale.com.","local"],
["prive","Ecobank","ecobank.com","emploi · stage","averifier","Portail panafricain.","local"],
["prive","UBA Cameroun","ubagroup.com","emploi · stage","averifier","Recrutement groupe.","local"],
["prive","BGFIBank","bgfi.com","emploi · stage","averifier","Groupe gabonais.","local"],
["prive","Access Bank Cameroun","accessbankplc.com","emploi · stage","averifier","A repris Standard Chartered CM.","local"],
["prive","BICEC","bicec.com","emploi · stage","averifier","Groupe BCP (Maroc).","local"],
["prive","Express Union","expressunion.cm","emploi · stage","averifier","Transfert / microfinance.","local"],
["prive","Activa Assurances","group-activa.com","emploi · stage","officiel","Leader panafricain basé au Cameroun.","local"],
["prive","Allianz Cameroun","allianz.cm","emploi · stage","averifier","Via careers.allianz.com.","local"],
["prive","MTN Cameroon","mtn.cm","emploi · stage · alternance","averifier","Programmes jeunes talents.","local"],
["prive","Orange Cameroun","orange.cm","emploi · stage · alternance","averifier","Souvent via orange.jobs.","local"],
["prive","SABC / Brasseries du Cameroun","lesbrasseriesducameroun.com","emploi · stage","averifier","Gros employeur (Castel). A racheté Guinness.","local"],
["prive","Nestlé Cameroun","nestle-cwa.com","emploi · stage · alternance","officiel","Page carrières vérifiée. Nesternship.","local"],
["prive","TotalEnergies Cameroun","totalenergies.cm","emploi · stage · alternance","officiel","Via careers.totalenergies.com.","local"],
["prive","Perenco Cameroun","perenco.com","emploi · stage","averifier","1er producteur pétrolier.","local"],
["prive","Dangote Cement","dangotecement.com","emploi","averifier","Filiale du groupe Dangote.","local"],
["prive","Cimencam","cimencam.cm","emploi · stage","averifier","Groupe Holcim.","local"],
["prive","Chococam","chococam.com","emploi · stage","averifier","Filiale Tiger Brands.","local"],
["prive","SOSUCAM","somdiaa.com","emploi · stage","averifier","Groupe Somdiaa.","local"],
["prive","Socapalm","socapalm.com","emploi","averifier","Groupe Socfin.","local"],
["prive","Olam Cameroun","olamgroup.com","emploi · stage","averifier","Négoce cacao / coton.","local"],
["prive","AGL (ex-Bolloré)","aglgroup.com","emploi · stage","averifier","Logistique / ports (~7000 salariés).","local"],
["prive","CFAO / Carrefour","cfaogroup.com","emploi · stage","averifier","Franchise Carrefour.","local"],
["prive","Maersk Cameroun","maersk.com","emploi · stage","averifier","Transport maritime.","local"],
["prive","SGS Cameroun","sgs.com","emploi","averifier","Inspection / certification.","local"],
["prive","Fed Africa (cabinet)","fedafrica.com","intermédiaire","interm","Cabinet — publie pour des tiers.","local"],
["prive","Michael Page Africa (cabinet)","michaelpageafrica.com","intermédiaire","interm","Cabinet — emplois Cameroun.","local"],
// FORMATIONS — local (en ligne / présentiel local)
["formations","Coursera","coursera.org","MOOC · certification","officiel","Audit gratuit, certificat payant (aide financière).","local"],
["formations","edX","edx.org","MOOC · certification","officiel","Universités (Harvard, MIT).","local"],
["formations","FUN-MOOC","fun-mooc.fr","MOOC francophone","officiel","100% francophone.","local"],
["formations","OpenClassrooms","openclassrooms.com","cours · parcours RNCP","officiel","Cours gratuits ; diplômes payants.","local"],
["formations","Google Career Certificates","grow.google","certification pro","officiel","Data, IT, UX. ~3-6 mois (via Coursera).","local"],
["formations","Microsoft Learn","learn.microsoft.com","cours · certification","officiel","Azure, 365, IA. Contenus gratuits.","local"],
["formations","DataCamp","datacamp.com","cours data / IA","officiel","Python, R, SQL.","local"],
["formations","Udacity","udacity.com","nanodegrees","officiel","Programmes 3-6 mois tech.","local"],
["formations","Khan Academy","khanacademy.org","cours fondamentaux","officiel","Gratuit. Maths, sciences, prog.","local"],
["formations","Udemy","udemy.com","cours","averifier","⚠️ Attestation sans valeur académique.","local"],
["formations","AUF — MOOC","auf.org","MOOC francophone","officiel","Agence Universitaire Francophonie.","local"],
["formations","ALX Africa","alxafrica.com","formation tech","officiel","Software, Data, IA. Gratuit (certains).","local"],
["formations","Gomycode","gomycode.com","bootcamp tech","officiel","Payant. Dakar + en ligne.","local"],
["formations","Orange Digital Center","orangedigitalcenters.com","formation numérique","officiel","GRATUIT. Dakar, Abidjan, Yaoundé, Douala.","local"],
["formations","Simplon Afrique","simplon.co","formation dev / num","officiel","Gratuit sur sélection.","local"],
["formations","Sonatel Academy","sonatel.sn","école de code","averifier","Gratuite (Dakar). Domaine à confirmer.","local"],
["formations","Meta Blueprint","facebook.com/business/learn","marketing digital","officiel","Certifications Meta.","local"],
["formations","AWS Skill Builder","skillbuilder.aws","cloud","officiel","Fondamentaux gratuits.","local"],
["formations","Google Cloud Skills Boost","cloudskillsboost.google","cloud","officiel","Badges / skill badges.","local"],
["formations","Goethe-Institut","goethe.de","allemand · certifications","officiel","En ligne + présentiel Dakar, Abidjan, Yaoundé.","local"],
["formations","Alliance Française","fondation-alliancefr.org","français · DELF/DALF","officiel","Très implantée localement.","local"],
["formations","British Council","britishcouncil.org","anglais · IELTS","officiel","LearnEnglish gratuit.","local"],
["formations","OIT — ITC-ILO","itcilo.org","formation emploi","officiel","Centre de formation de l'OIT.","local"],
["formations","UNITAR","unitar.org","cours ONU","officiel","Diplomatie, climat, paix.","local"],
["formations","Banque mondiale — Open Learning","olc.worldbank.org","MOOC développement","officiel","Gratuit.","local"],
["formations","GIZ — Atingi","atingi.org","formation (Afrique)","officiel","Plateforme soutenue par GIZ.","local"],
["formations","UN CC:Learn","unccelearn.org","MOOC climat","officiel","Certifs changement climatique.","local"],
["formations","EducationUSA Cameroon","educationusa.state.gov","orientation études USA","officiel","Conseil gratuit en présentiel.","local"],
// OLYMPIADES
["olympiades","Olympiade Maths (IMO)","imo-official.org","maths · secondaire","officiel","Sélection nationale (CI, SN, CM via AIMS).","local"],
["olympiades","Olympiade Panafricaine Maths (PAMO)","africanmathunion.org","maths · secondaire","officiel","3 pays actifs. Édition 2026 Yamoussoukro.","local"],
["olympiades","Olympiades Francophonie Maths","auf.org","maths · secondaire","averifier","Via ministère. Domaine à confirmer.","local"],
["olympiades","Olympiade Physique (IPhO)","ipho2026.org","physique · secondaire","averifier","CM 1re participation 2025. Via ministère.","local"],
["olympiades","Olympiade Biologie (IBO)","ibo-info.org","biologie · secondaire","averifier","Comité national à créer.","inter"],
["olympiades","Olympiade Informatique (IOI)","ioinformatics.org","informatique · secondaire","averifier","Comité national à créer.","inter"],
["olympiades","Olympiade Chimie (IChO)","ichosc.org","chimie · secondaire","averifier","Pas de comité national solide.","inter"],
["olympiades","Olympiade Géographie (iGeo)","geoolympiad.org","géographie · secondaire","averifier","Comité national à confirmer.","inter"],
["olympiades","Concours Kangourou","mathkangourou.org","maths QCM · secondaire","averifier","Via l'établissement si relais national.","local"],
["olympiades","Génies en Herbe","aksf.org","culture G · secondaire","averifier","Jeu-quiz francophone, via établissement.","local"],
["olympiades","ICPC (programmation)","icpc.global","informatique · universitaire","officiel","Région Africa & Arab. Via université / coach.","local"],
["olympiades","IMC (maths université)","imc-math.org.uk","maths · universitaire","averifier","Par université.","local"],
["olympiades","iGEM (bio synthèse)","igem.org","biologie · universitaire","officiel","Pas de sélection nat. ; frais + déplacement.","inter"],
["olympiades","Jeux de la Francophonie","jeux.francophonie.org","culture / sciences · 18-35","officiel","Via Commission nationale (ministère Jeunesse).","local"],
// CONCOURS / PRIX / PROGRAMMES
["concours","Tony Elumelu (TEFConnect)","tefconnect.com","entrepreneuriat","officiel","5000$ + mentorat. SEUL canal légitime.","local"],
["concours","Orange POESAM","poesam.orange.com","prix entrepreneur social","officiel","Phase nationale CM / SN / CI.","local"],
["concours","TotalEnergies Startupper","startupper.totalenergies.com","concours startup","officiel","Éditions nationales, < 35 ans.","local"],
["concours","Africa's Business Heroes","africabusinessheroes.org","concours / prix","officiel","Jack Ma Foundation. En ligne.","local"],
["concours","Seedstars","seedstars.com","concours / programme","officiel","Compétitions nationales.","local"],
["concours","Ashoka","ashoka.org","fellowship","officiel","Entrepreneurs sociaux.","local"],
["concours","Anzisha Prize","anzishaprize.org","prix","officiel","Jeunes 15-22 ans. En ligne.","local"],
["concours","Hult Prize","hultprize.org","entrepreneuriat social","officiel","Round On-Campus universitaire.","local"],
["concours","MEST Africa","meltwater.org","programme / concours","officiel","Formation présentiel Accra (Ghana).","inter"],
["concours","Generation Global (Tony Blair)","generation.global","programme jeunesse","officiel","Dialogues interculturels en ligne.","local"],
["concours","Microsoft Imagine Cup","imaginecup.microsoft.com","hackathon","officiel","Tech étudiante mondiale. En ligne.","local"],
["concours","Google Developer Groups","gdg.community.dev","communauté tech","officiel","Chapitres Douala, Dakar, Abidjan.","local"],
["concours","Google for Startups","startup.google.com","programme","officiel","Black Founders Fund.","local"],
["concours","AfricaTech Awards (VivaTech)","vivatechnology.com","prix tech","officiel","Candidature en ligne.","local"],
["concours","Queen's Commonwealth Essay","royalcwsociety.org","concours de rédaction","officiel","CAMEROUN uniquement. Gratuit.","local"],
["concours","UPU Letter-Writing (jeunes)","upu.int","concours de rédaction","officiel","Via la poste nationale.","local"],
["concours","YALI Network","yali.state.gov","cours leadership en ligne","officiel","Gratuit, 18-35 ans.","local"],
["concours","YALI Regional Leadership Center","yali.state.gov","programme leadership","officiel","Présentiel Accra / Dakar.","inter"],
["concours","Mandela Washington Fellowship","mwfellows.org","programme leadership","officiel","Aux États-Unis.","inter"],
["concours","Generation Unlimited (UNICEF)","generationunlimited.org","programme jeunesse","officiel","Imagen Ventures.","local"],
["concours","Yoma","yoma.world","missions rémunérées","officiel","Jeunes africains, en ligne.","local"],
["concours","Bourse excellence Cameroun","minesup.gov.cm","bourse locale","officiel","Étudier au Cameroun.","local"],
["concours","Bourses Sénégal (CAMPUSEN)","campusen.sn","bourse locale","officiel","Bacheliers / étudiants.","local"],
["concours","Bourses Côte d'Ivoire (MESRS)","mesrs.ci","bourse locale","averifier","Via servicepublic.gouv.ci.","local"],
// BOURSES — international (émigration)
["bourses","Campus France Cameroun","cameroun.campusfrance.org","bourse · études France","officiel","Guichet officiel études en France.","inter"],
["bourses","Ambassade de France (BGF)","cm.ambafrance.org","bourse","officiel","Bourses du Gouvernement français.","inter"],
["bourses","AUF (mobilité)","auf.org","bourse · mobilité","officiel","Masters, doctorat. Bureau Yaoundé.","inter"],
["bourses","DAAD (Allemagne)","daad.de","bourse","officiel","Antenne régionale Yaoundé.","inter"],
["bourses","Chevening (Royaume-Uni)","chevening.org","bourse","officiel","Master 1 an au R-U.","inter"],
["bourses","Commonwealth","cscuk.fcdo.gov.uk","bourse","officiel","Master / PhD. Cameroun uniquement.","inter"],
["bourses","Fulbright (USA)","us.fulbrightonline.org","bourse","officiel","Via l'ambassade US.","inter"],
["bourses","Türkiye Burslari","turkiyeburslari.gov.tr","bourse","officiel","Licence / master / doctorat.","inter"],
["bourses","CSC (Chine)","campuschina.org","bourse","officiel","Gouvernement chinois.","inter"],
["bourses","Mandela Rhodes Foundation","mandelarhodes.org","bourse postgraduate","officiel","Afrique du Sud. Panafricaine, Camerounais éligibles.","inter"],
["bourses","Mastercard Foundation","mastercardfdn.org","bourse · formation","officiel","Via universités. ⚠️ Beaucoup d'arnaques.","inter"],
["bourses","AMCI (Maroc)","amci.ma","bourse","officiel","Études au Maroc, via MINESUP.","inter"],
["bourses","EduCanada","educanada.ca","bourse","officiel","Bourses canadiennes.","inter"],
["bourses","Study in Japan / MEXT","studyinjapan.go.jp","bourse","officiel","Via l'ambassade du Japon.","inter"],
["bourses","France Volontaires","france-volontaires.org","volontariat","officiel","Espace Volontariats à Yaoundé.","inter"],
["bourses","OIF — volontariat","francophonie.org","volontariat","officiel","Volontaires 21-34 ans.","inter"],
["bourses","Union africaine (AU-YVC)","au.int","volontariat","officiel","Youth Volunteer Corps.","inter"],
["bourses","VSO International","vsointernational.org","volontariat","officiel","Volontariat développement.","inter"],
// UNESCO — répartis par type
["bourses","UNESCO Fellowships Programme","unesco.org","bourse","officiel","Via la Commission nationale UNESCO. Great Wall/Chine, Japon-Obuchi…","inter"],
["bourses","IHE Delft (eau, UNESCO)","un-ihe.org","bourse · formation","officiel","Pays-Bas. Cours en ligne gratuits.","inter"],
["formations","UNESCO-UNEVOC (TVET)","unevoc.unesco.org","réseau · formation","officiel","Centres nationaux + ressources en ligne.","local"],
["formations","IIEP-UNESCO (Dakar)","iiep.unesco.org","formation · MOOC","officiel","Bureau régional pour l'Afrique à Dakar.","local"],
["formations","UNESCO — ressources libres (OER)","unesdoc.unesco.org","formation · ressources","officiel","Gratuit. Bibliothèque numérique ouverte.","local"],
["formations","Écoles associées UNESCO (ASPnet)","aspnet.unesco.org","programme écoles","officiel","Via la Commission nationale.","local"],
["concours","L'Oréal-UNESCO Femmes & Science","forwomeninscience.com","prix · bourse recherche","officiel","Jeunes Talents Afrique. Doctorantes/post-doc, en ligne.","local"],
["concours","Prix UNESCO (presse, alphabétisation, filles)","unesco.org","prix","officiel","Via la Commission nationale UNESCO.","local"],
["concours","Forum des jeunes UNESCO","unesco.org","programme jeunesse","officiel","Délégation nationale, Paris + en ligne.","inter"],
// SPORT — football : académies & détection
["sport","Institut Diambars (Sénégal)","diambars.org","académie sport-études","officiel","Détection gratuite à Saly. ⚠️ faux « recruteurs Diambars » sur les réseaux.","local"],
["sport","Génération Foot (Sénégal)","generationfoot.org","académie (partenaire FC Metz)","officiel","Formation au pays d'abord ; ne jamais payer pour « aller à Metz ».","local"],
["sport","ASEC Mimosas (Côte d'Ivoire)","asec.ci","centre de formation","officiel","Site officiel = asec.ci (pas asecmimosas.com). Tests Sol Béni 12-15 ans GRATUITS.","local"],
["sport","Right to Dream (Ghana, panafricain)","righttodream.com","académie + bourse","officiel","Essais GRATUITS. « RtD ne facture jamais un essai ».","inter"],
["sport","Réseau JMG Academy","jmgfootball.com","réseau d'académies","officiel","Académies actives en 2026 : Djekanou (Côte d'Ivoire) et Bamako. Les autres sont fermées.","local"],
["sport","Kadji Sports Academy (Douala)","à confirmer","centre de formation","averifier","Structure réelle (1995). Se renseigner sur place, jamais payer un intermédiaire.","local"],
["sport","EFBC — École de Foot des Brasseries (Douala)","à confirmer","centre de formation","averifier","Historique (1989). Via le club/l'entreprise.","local"],
["sport","Fondation Samuel Eto'o (Cameroun)","à confirmer","détection de jeunes","averifier","Détection réelle ; vérifier chaque « casting » annoncé.","local"],
["sport","FECAFOOT (Cameroun)","fecafoot-officiel.com","fédération · détection · formation","officiel","⚠️ Très usurpée : seul ce domaine fait foi. Convocation en sélection GRATUITE.","local"],
["sport","Fédération Sénégalaise de Football (FSF)","fsfoot.sn","fédération · détection","officiel","Détection via clubs affiliés, jamais payante.","local"],
["sport","Fédération Ivoirienne de Football (FIF)","fifciv.com","fédération · centre technique","officiel","Site officiel = fifciv.com (pas fif.ci). Voie via clubs affiliés.","local"],
// SPORT — football : institutions & carrières
["sport","FIFA — Emplois & stages","jobs.fifa.com","emploi · stage","officiel","Siège Zurich. Candidature gratuite ; ⚠️ aucun « frais de dossier ».","inter"],
["sport","FIFA Foundation","inside.fifa.com","financement de projets","officiel","Finance des associations locales, pas des individus.","local"],
["sport","Football for Schools (FIFA)","footballforschools.fifa.com","programme éducatif","officiel","100% gratuit, via fédération + ministère.","local"],
["sport","FIFA Training Centre","fifatrainingcentre.com","formation entraîneurs (en ligne)","officiel","GRATUIT, inscription libre, en français.","local"],
["sport","FIFA Diploma in Club Management","inside.fifa.com","diplôme dirigeants de clubs","officiel","Sélection FIFA ; payé à la FIFA, jamais un intermédiaire.","local"],
["sport","FIFA Talent Development Scheme","fifa.com","programme via fédérations","officiel","⚠️ Aucune « FIFA Academy » privée payante : la FIFA passe par les fédérations.","local"],
["sport","FIFA Connect","inside.fifa.com","enregistrement joueurs","officiel","⚠️ Payer pour un « FIFA Connect ID » = arnaque. Ça passe par le club/la fédération.","local"],
["sport","CAF — Emplois","cafonline.com","emploi","officiel","Siège Le Caire. Candidature gratuite.","inter"],
["sport","CAF — Licences entraîneur A/B/C/D","cafonline.com","formation","officiel","Via la fédération ; on commence par la licence D. Une licence s'obtient, ne s'achète pas.","local"],
["sport","CAF — Arbitrage","cafonline.com","formation arbitres","officiel","Via la commission d'arbitrage de la fédération. Le badge FIFA ne s'achète pas.","local"],
["sport","FIFA Master (CIES)","cies.ch","master management du sport","officiel","18 mois Angleterre/Italie/Suisse. ~14 462 €/an. Bourses possibles.","inter"],
["sport","FIFA/CIES International Programme","cies.ch","diplôme management du sport","officiel","Confirmé à l'UCAD (Dakar). Inscription via l'université partenaire.","local"],
// SPORT — basket & sports de ballon
["sport","NBA Academy Africa","nbaacademy.nba.com","académie (FERMÉE oct. 2026)","risque","⚠️ Campus Saly FERMÉ. Toute « invitation NBA Academy Sénégal 2026 » est FAUSSE.","inter"],
["sport","Basketball Africa League (BAL)","bal.nba.com","ligue pro","officiel","Ligue de clubs pros, pas pour débutants. ⚠️ faux « agent BAL ».","inter"],
["sport","SEED Project (Sénégal)","seedproject.org","académie basket + études","officiel","Sélection sur test sportif + dossier scolaire vérifié. Non monnayable.","local"],
["sport","Giants of Africa","giantsofafrica.org","camps gratuits","officiel","Camps 100% GRATUITS (CM/SN/CI). Sur invitation au mérite.","local"],
["sport","FIBA Afrique","about.fiba.basketball","camps détection · formation","officiel","Camps jeunes via ta fédération nationale. Sélections non payantes.","local"],
["sport","Basketball Without Borders (NBA/FIBA)","nba.com","camp d'élite (sur invitation)","officiel","Gratuit, sur invitation. ⚠️ pas de site propre : tout « site BWB » est suspect.","local"],
["sport","Rugby Africa","rugbyafrique.com","développement rugby","officiel","Via l'union nationale de rugby.","local"],
["sport","Volleyball — via la fédération nationale","à confirmer","compétitions jeunes","risque","⚠️ cavb.org est DÉTOURNÉ (spam d'affiliation) : ne pas l'utiliser. Passer par ta fédération nationale de volley.","local"],
["sport","CAHB — Handball africain","cahbonline.info","compétitions jeunes","officiel","Via la fédération nationale de handball.","local"],
// SPORT — athlétisme & olympisme
["sport","World Athletics","worldathletics.org","formation · développement","officiel","Certification entraîneurs (CECS) via la fédération. ⚠️ faux « certificats » en ligne.","local"],
["sport","Confédération Africaine d'Athlétisme (CAA)","caaweb.org","compétitions · centre Dakar","averifier","Siège Dakar (centre haut niveau). Via la fédération. Domaine à confirmer.","local"],
["sport","CIO — Solidarité Olympique","olympics.com","bourses athlètes · formation","officiel","Bourses OBLIGATOIREMENT via le Comité National Olympique. Jamais un intermédiaire.","local"],
["sport","CNOSC — Comité Nat. Olympique (Cameroun)","cnosc.org","guichet bourses olympiques","averifier","Guichet national. ⚠️ pubs de paris repérées en pied de page, recouper via olympics.com.","local"],
["sport","CNOSS — Comité Nat. Olympique (Sénégal)","cnoss.sn","guichet bourses olympiques","officiel","Académie olympique + centres OLYMPAFRICA. Pilote les JOJ Dakar 2026.","local"],
["sport","CNO-CIV — Comité Nat. Olympique (Côte d'Ivoire)","cno-civ.ci","guichet bourses olympiques","officiel","Nom exact = CNO-CIV (pas « COICI »). Mail sg@cno-civ.ci.","local"],
["sport","Jeux de la Francophonie","jeux.francophonie.org","compétition sport + culture","officiel","Erevan 2027. Les 3 pays éligibles. Sélection nationale gratuite.","local"],
["sport","JOJ Dakar 2026","olympics.com","Jeux Olympiques de la Jeunesse","officiel","1ers JO en Afrique. Sélection via le CNO. ⚠️ faux « castings JOJ » payants.","local"],
["sport","Jeux du Commonwealth","commonwealthsport.com","compétition","officiel","⚠️ Cameroun seul membre ; ne concerne PAS le Sénégal ni la Côte d'Ivoire.","local"],
// SPORT — sport-développement, fondations & bourses sport-études
["sport","Sport en Commun","sportencommun.org","hub Afrique francophone","averifier","Soutenu AFD + FIFA. Appels à projets, ressources, emplois. Hub clé pour les 3 pays.","local"],
["sport","sportanddev.org","sportanddev.org","portail emplois du secteur","averifier","Meilleur point d'entrée emplois & appels à projets sport-développement.","local"],
["sport","Right To Play","righttoplay.com","emploi · volontariat","officiel","Carrières via righttoplay.org.uk. Candidature gratuite.","local"],
["sport","Laureus Sport for Good","laureus.com","financement d'ONG","officiel","Finance des associations, pas des individus.","local"],
["sport","Common Goal (ex-streetfootballworld)","common-goal.org","réseau football-for-good","officiel","On y accède via une ONG locale du réseau.","local"],
["sport","Peace and Sport","peace-sport.org","programmes · campagnes","averifier","#WhiteCard, projets locaux. Basé à Monaco.","local"],
["sport","PLAY International","play-international.org","emploi · volontariat (VSC)","averifier","Bureau au Sénégal. Offres publiées sur le site.","local"],
["sport","AFD — Sport & développement","afd.fr","financement · emploi","officiel","Finance des structures. Emplois/stages via l'AFD.","local"],
["sport","GIZ — Sport for Development","giz.de","programme · emploi","officiel","Emplois via giz.de/career uniquement.","local"],
["sport","UNICEF — Sport for Development","unicef.org","programme · emploi · stage","officiel","ONU : jamais de paiement à aucune étape.","local"],
["sport","UNESCO — Fit for Life","unesco.org","programme · leadership jeunes","officiel","Sport Leadership jeunes. Carrières via careers.unesco.org.","local"],
["sport","Erasmus+ Sport (UE)","sport.ec.europa.eu","financement de projets","averifier","Pour organisations ; pays tiers éligibles comme partenaires.","local"],
["sport","Bourses sport-études NCAA (USA)","ncaa.org","bourse sport-études","officiel","⚠️ Via le NCAA Eligibility Center + contact direct des coachs, pas d'agence payante.","inter"],
["sport","Bourses sport-études NAIA (USA)","naia.org","bourse sport-études","officiel","Via PlayNAIA (play.mynaia.org). ⚠️ mêmes pièges que la NCAA : fuyez les agences qui « garantissent ».","inter"],
// AMBASSADES & COOPÉRATION — Cameroun
["diplo","Ambassade des États-Unis (Cameroun)","cm.usembassy.gov","emploi · stage · bourses","officiel","Candidature UNIQUEMENT via le système ERA. Gratuite. Fulbright via l'ambassade.","local"],
["diplo","ERA — portail des missions américaines","erajobs.state.gov","portail de recrutement","officiel","Canal unique des ambassades US (Yaoundé, Dakar, Abidjan). ⚠️ fausses pages Facebook.","local"],
["diplo","Ambassade de France (Cameroun)","cm.diplomatie.gouv.fr","emploi · bourses","officiel","Ex-cm.ambafrance.org. Offres via l'Institut français et Campus France.","local"],
["diplo","Haut-Commissariat britannique (Yaoundé)","gov.uk","emploi · stages","officiel","Recrutement via fco.tal.net. Engagement écrit : « jamais de frais ».","local"],
["diplo","Haut-commissariat du Canada (Yaoundé)","international.gc.ca","emploi","officiel","Portail de dotation en ligne. Ne parraine pas de permis : un emploi n'est pas un visa.","local"],
["diplo","Ambassade d'Allemagne (Yaoundé)","jaunde.diplo.de","emploi","officiel","Candidatures via l'adresse officielle en @auswaertiges-amt.de.","local"],
["diplo","Délégations de l'Union européenne (CM · SN · CI)","eeas.europa.eu","emploi · stages","officiel","Candidature par les e-mails officiels eeasjobs-XXX@eeas.europa.eu. CV Europass.","local"],
["diplo","Ambassade de Belgique (Yaoundé)","cameroon.diplomatie.belgium.be","emploi","officiel","Offres publiées sur le site officiel quand il y en a.","local"],
["diplo","Ambassade de Suisse (Yaoundé)","schweiz-kamerun.eda.admin.ch","emploi","officiel","Rubrique « Job vacancies » du site officiel.","local"],
["diplo","Ambassade du Japon (Yaoundé)","cmr.emb-japan.go.jp","emploi · bourses MEXT","officiel","Avis publiés sur le site ; bourses MEXT gratuites.","local"],
["diplo","Ambassade d'Espagne (Yaoundé)","exteriores.gob.es","emploi","officiel","Page « Ofertas de empleo » de l'ambassade.","local"],
// AMBASSADES — Dakar & Abidjan
["diplo","Ambassades des États-Unis (Dakar · Abidjan)","ci.usembassy.gov","emploi · stage","officiel","Via ERA uniquement — « les CV envoyés autrement sont ignorés ». sn.usembassy.gov à recontrôler.","local"],
["diplo","Ambassades de France (Dakar · Abidjan)","sn.diplomatie.gouv.fr","emploi · bourses","officiel","Aussi ci.diplomatie.gouv.fr. Les anciens ambafrance redirigent ici.","local"],
["diplo","Ambassades du Royaume-Uni (Dakar · Abidjan)","gov.uk","emploi · stages","officiel","Candidature via fco.tal.net. Jamais de frais.","local"],
["diplo","Ambassades d'Allemagne (Dakar · Abidjan)","dakar.diplo.de","emploi","officiel","Aussi abidjan.diplo.de.","local"],
["diplo","Belgique · Suisse · Japon (Dakar & Abidjan)","diplomatie.belgium.be","emploi","officiel","Suisse : eda.admin.ch ; Japon : emb-japan.go.jp. Avis sur les sites officiels.","local"],
// COOPÉRATION & INSTITUTIONS
["diplo","GIZ (coopération allemande)","giz.de","emploi · programmes","officiel","Offres UNIQUEMENT sur jobs.giz.de. Gratuit.","local"],
["diplo","AFD — Agence Française de Développement","afd.fr","emploi · financement","officiel","Recrutement « entièrement gratuit » (engagement écrit, mise en garde anti-fraude).","local"],
["diplo","Expertise France","expertisefrance.fr","emploi · missions","officiel","Portail officiel de candidature.","local"],
["diplo","JICA (coopération japonaise)","jica.go.jp","emploi local · programmes","officiel","⚠️ le volontariat JOCV est réservé aux citoyens japonais : toute offre contraire est une arnaque.","local"],
["diplo","Banque mondiale","worldbank.org","emploi · stages · YPP","officiel","⚠️ fausses offres massives : seuls worldbank.org et les e-mails @worldbank.org font foi.","local"],
["diplo","Banque Africaine de Développement (BAD)","afdb.org","emploi · stages · YPP","officiel","Siège Abidjan. Young Professionals Program (≤32 ans) attendu nov.-déc. ⚠️ fausses offres fréquentes.","local"],
["diplo","OIT / BIT","jobs.ilo.org","emploi · stages","officiel","Bureaux Yaoundé, Dakar, Abidjan. Candidature gratuite.","local"],
["diplo","Peace Corps (États-Unis)","peacecorps.gov","staff local","officiel","⚠️ le volontariat est réservé aux citoyens américains ; seuls les postes de staff local sont ouverts.","local"],
["diplo","Campus France — bourses (Eiffel…)","campusfrance.org","bourses d'études","officiel","La bourse Eiffel est déposée par l'établissement français, jamais par un intermédiaire payant.","inter"],
["diplo","Chevening (Royaume-Uni)","chevening.org","bourse","averifier","Cycle 2027-28 clos (6 oct.) ; prochain appel août 2027. Gratuit.","inter"],
["diplo","Türkiye Bursları (Turquie)","turkiyeburslari.gov.tr","bourse d'État","averifier","Bourses turques officielles ; domaine à confirmer par visite.","inter"],
["diplo","British Council","britishcouncil.org","emploi · programmes","averifier","Actif surtout au Sénégal ; CM/CI via centres partenaires.","local"],
["diplo","Enabel (coopération belge)","enabel.be","emploi","averifier","Présence limitée dans les 3 pays ; offres sur jobs.enabel.be.","local"],
// ARTS — cinéma & audiovisuel
["arts","FESPACO (Ouagadougou)","fespaco.bf","festival cinéma","officiel","Inscription du film via le site. Candidater depuis le pays ; 30e éd. mars 2027.","local"],
["arts","Festival Écrans Noirs (Yaoundé)","ecransnoirs.org","festival cinéma","officiel","30e éd. 21-28 nov. 2026. Inscription via l'appli officielle.","local"],
["arts","Clap Ivoire","à confirmer","concours courts métrages","averifier","Via le Ministère de la Culture ivoirien. Gratuit, domaine à confirmer.","local"],
["arts","Dakar Court","à confirmer","festival courts métrages","averifier","Soumission via FilmFreeway ; vérifier la fiche officielle avant de payer.","local"],
["arts","Fonds Image de la Francophonie (OIF)","imagesfrancophones.org","fonds cinéma","officiel","Les 3 pays éligibles. Candidature GRATUITE via « Accès pro ».","local"],
["arts","Aide aux cinémas du monde (CNC)","cnc.fr","fonds de coproduction","officiel","Exige un coproducteur français. Dépôt gratuit.","inter"],
["arts","La Fabrique Cinéma (Institut français)","institutfrancais.com","résidence · accompagnement","officiel","1er/2e long métrage. Gratuit ; lauréats présentés à Cannes.","local"],
["arts","Ateliers Varan","ateliersvaran.com","formation documentaire","officiel","Ateliers décentralisés en Afrique, souvent subventionnés.","local"],
["arts","Berlinale Talents","berlinale-talents.de","formation · networking","officiel","Sommet à Berlin. Pour profils déjà expérimentés.","inter"],
["arts","Doha Film Institute","dohafilm.com","fonds · labs","officiel","Grants + labs. Dépôt GRATUIT, jamais de « frais de dossier ».","local"],
["arts","Red Sea Fund","redseafilmfest.com","fonds cinéma","officiel","Ouvert à l'Afrique. Dépôt gratuit.","local"],
["arts","ESAV Marrakech","esav.ac.ma","école de cinéma","averifier","École privée au Maroc : frais de scolarité normaux ≠ arnaque.","inter"],
// ARTS — musique
["arts","Prix Découvertes RFI","prixdecouvertes.com","concours · prix 10 000 €","officiel","Gratuit, 18+, les 3 pays. ⚠️ aucun site tiers ne « t'inscrit » contre paiement.","local"],
["arts","Visa for Music (Rabat)","visaformusic.com","salon pro · showcases","averifier","Candidature gratuite. ⚠️ pubs casino sur le site : vérifier l'URL.","local"],
["arts","Music In Africa","musicinafrica.net","portail · appels à projets","officiel","Annuaire + vrais appels. Gratuit. Le meilleur réflexe anti-faux-plan.","local"],
["arts","Fonds OIF — musique / mobilité","francophonie.org","financement","officiel","Mobilité & découvrabilité. Appels publics et gratuits.","local"],
["arts","UNESCO — FIDC","unesco.org","financement de projets","officiel","Finance des structures via la Commission nationale UNESCO.","local"],
["arts","Institut français — Création Africa","institutfrancais.com","résidences · fonds","officiel","Via l'Institut français local. Appels gratuits.","local"],
["arts","Goethe-Institut (CM / SN)","goethe.de","formations · résidences","officiel","Antennes Cameroun/Sénégal. Programmes gratuits.","local"],
["arts","Orange Music Talents","orange.cm","concours de détection","averifier","⚠️ beaucoup de faux « castings Orange ». Via les canaux officiels Orange.","local"],
["arts","SONACAM — droits d'auteur (Cameroun)","sonacam.cm","droits d'auteur","officiel","LA démarche officielle au Cameroun (remplace l'ancienne SOCAM).","local"],
["arts","SODAV — droits d'auteur (Sénégal)","sodav.sn","droits d'auteur","officiel","Enregistre tes œuvres pour toucher des royalties.","local"],
["arts","BURIDA — droits d'auteur (Côte d'Ivoire)","buridaci.com","droits d'auteur","averifier","Site en refonte ; sinon passer par le siège à Abidjan.","local"],
// ARTS — arts visuels, design & mode
["arts","Dak'Art — Biennale de Dakar","biennaledakar.org","biennale art contemporain","officiel","16e éd. 19 nov.-19 déc. 2026. Ouvert Afrique + diasporas.","local"],
["arts","Black Rock Senegal (K. Wiley)","blackrocksenegal.org","résidence d'artiste","officiel","Dakar. Candidature GRATUITE, bourse + logement offerts.","local"],
["arts","Raw Material Company (Dakar)","rawmaterialcompany.org","centre d'art · résidences","averifier","Résidences et programmes. Domaine à confirmer.","local"],
["arts","Cité internationale des arts","citeinternationaledesarts.fr","résidence d'artiste","officiel","Paris. Appel à candidatures.","inter"],
["arts","Rencontres de Bamako (photo)","à confirmer","biennale photographie","averifier","Via Ministère/Institut français. Domaine à confirmer.","inter"],
["arts","Dakar Fashion Week","à confirmer","mode · jeunes créateurs","averifier","⚠️ faux concours de mannequinat payants. Vérifier l'organisateur.","local"],
["arts","FIMA (mode, Niger)","à confirmer","festival de mode","averifier","Festival d'Alphadi. Domaine à confirmer.","inter"],
// ARTS — écriture, journalisme & médias
["arts","Prix Ahmadou Kourouma","salondulivre.ch","prix littéraire","officiel","Livre déjà publié chez un éditeur. Gratuit ; pas d'auto-édition payante.","inter"],
["arts","Prix des cinq continents (Francophonie)","francophonie.org","prix littéraire","officiel","Déposé par les ÉDITEURS. Gratuit. ⚠️ jamais à compte d'auteur.","local"],
["arts","Queen's Commonwealth Writing Competition","royalcwsociety.org","concours d'écriture jeunes","officiel","⚠️ Cameroun éligible seulement (Commonwealth). Gratuit, en ligne.","local"],
["arts","Bourse Ghislaine Dupont & Claude Verlon (RFI)","rfi.fr","bourse journalisme","officiel","Jeunes journalistes/techniciens radio d'Afrique francophone. Gratuit.","local"],
["arts","CFI Médias","cfi.fr","formations · projets médias","officiel","Agence médias du Quai d'Orsay. Appels gratuits.","local"],
["arts","DW Akademie","akademie.dw.com","formations · master","averifier","Projets locaux + master à Bonn (bourse DAAD).","local"],
["arts","Thomson Foundation","thomsonfoundation.org","formations · concours","officiel","Young Journalist Award + e-learning gratuit.","local"],
["arts","Reuters Institute Fellowship (Oxford)","reutersinstitute.politics.ox.ac.uk","fellowship journalisme","officiel","Réouverture janvier 2027. Pour journalistes expérimentés.","inter"],
["arts","Africa Check","africacheck.org","fact-checking · formations","officiel","Formations + bourses. Référence anti-infox d'Afrique.","local"],
["arts","Pulitzer Center","pulitzercenter.org","bourses de reportage","averifier","Finance TON reportage. Gratuit ; l'argent va vers le journaliste.","local"],
["arts","ESSTIC / ASMAC (Yaoundé)","minesup.gov.cm","école de journalisme","officiel","Concours d'État via le MINESUP. Frais officiels seulement.","local"],
["arts","CESTI — UCAD (Dakar)","cesti.ucad.sn","école de journalisme","officiel","Concours d'entrée (~septembre). Frais officiels UCAD.","local"],
["arts","ISTC Polytechnique (Abidjan)","istc.ci","école de communication","averifier","⚠️ le ministère alerte sur la FRAUDE au concours. Frais officiels seulement.","local"],
// PLATEFORMES — local
["plateforme","Minajobs","minajobs.net","emploi · stage · concours","averifier","Relais fiable, employeurs nommés.","local"],
["plateforme","ReliefWeb","reliefweb.int","emploi humanitaire","officiel","Le plus sûr : ONG/agences accréditées.","local"],
["plateforme","UN Talent / UN Vacancies","untalent.org","emploi ONU","officiel","Agrège les sites officiels ONU.","local"],
["plateforme","Emploi.cm","emploi.cm","emploi","averifier","Beaucoup de PME. Vérifier l'employeur.","local"],
["plateforme","Kamerpower","kamerpower.com","emploi · concours","risque","Republie sans garantie. Recouper.","local"],
["plateforme","Cameroon Desks","cameroondesks.com","emploi · ONG · bourses","risque","Blog qui republie.","local"],
["plateforme","talent.com","cm.talent.com","méta-moteur","risque","Scrape automatique. Fiabilité faible.","local"],
["plateforme","Indeed Cameroun","cm.indeed.com","méta-moteur","risque","Republication massive.","local"],
["plateforme","LinkedIn","linkedin.com","emploi cadres","averifier","Employeur vérifiable via page entreprise.","local"],
];

let filter="all", volet="all", query="";
let fav=[]; try{ fav=JSON.parse(localStorage.getItem('swimpe_fav')||'[]'); }catch(e){ fav=[]; }
const idOf=r=>r[1];
const saveFav=()=>{ try{ localStorage.setItem('swimpe_fav', JSON.stringify(fav)); }catch(e){} };

const totals={}; D.forEach(r=>{ totals[r[0]]=(totals[r[0]]||0)+1; });
const catsEl=document.getElementById('cats');
catsEl.innerHTML='<button class="chip" data-f="all" aria-pressed="true">Tout <span class="n">'+D.length+'</span></button>'+
  ORDER.map(c=>'<button class="chip" data-f="'+c+'" aria-pressed="false">'+SHORT[c]+' <span class="n">'+(totals[c]||0)+'</span></button>').join('');

function fiab(f){ if(f==='officiel')return '<span class="badge b-off">Officiel</span>';
  if(f==='averifier')return '<span class="badge b-ver">À vérifier</span>';
  if(f==='risque')return '<span class="badge b-ris">Risqué</span>';
  return '<span class="badge b-itm">Intermédiaire</span>'; }

function render(){
  const q=query.trim().toLowerCase();
  const rows=D.filter(r=>{
    if(filter!=='all' && r[0]!==filter) return false;
    if(volet==='local' && r[6]!=='local') return false;
    if(volet==='inter' && r[6]!=='inter') return false;
    if(volet==='fav' && fav.indexOf(idOf(r))<0) return false;
    if(q){ const hay=(r[1]+' '+r[2]+' '+r[3]+' '+r[5]).toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  });
  document.getElementById('count').textContent=rows.length+' organisme'+(rows.length>1?'s':'')+
    (volet==='fav'?' sélectionné'+(rows.length>1?'s':''):'')+(filter!=='all'?' · '+CATS[filter]:'')+
    (volet==='local'?' · 🏠 Local':volet==='inter'?' · ✈️ International':'');
  const list=document.getElementById('list');
  if(!rows.length){ list.innerHTML='<div class="empty">'+(volet==='fav'?'Aucune sélection pour l\'instant. Touche ⭐ sur un organisme pour le garder ici.':'Aucun résultat pour ces filtres.')+'</div>'; }
  else{
    let html='';
    ORDER.forEach(cat=>{
      const sub=rows.filter(r=>r[0]===cat); if(!sub.length) return;
      html+='<section class="cat"><h2>'+CATS[cat]+' <span class="cc">'+sub.length+'</span></h2><p class="cdesc">'+CDESC[cat]+'</p>';
      sub.forEach(r=>{
        const on=fav.indexOf(idOf(r))>=0;
        html+='<div class="card"><div class="body"><h3>'+r[1]+'</h3><div class="dom">'+r[2]+'</div><p><b style="color:var(--fg);font-weight:600">'+r[3]+'</b> — '+r[5]+'</p>'+
          '<div class="row">'+fiab(r[4])+'<span class="badge '+(r[6]==='local'?'b-loc">🏠 Local':'b-int">✈️ International')+'</span></div></div>'+
          '<button class="star" data-id="'+r[1].replace(/"/g,'&quot;')+'" aria-pressed="'+on+'" title="Sélectionner">'+(on?'★':'☆')+'</button></div>';
      });
      html+='</section>';
    });
    list.innerHTML=html;
  }
  const doms=[...new Set(rows.filter(r=>r[4]==='officiel'&&r[2]&&r[2].indexOf(' ')<0&&r[2].indexOf('.')>0).map(r=>r[2]))];
  document.getElementById('domtext').value=doms.join('\n');
}

catsEl.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;
  filter=b.dataset.f; [...catsEl.children].forEach(c=>c.setAttribute('aria-pressed', c===b)); render();});
document.getElementById('volets').addEventListener('click',e=>{const b=e.target.closest('.seg');if(!b)return;
  volet=b.dataset.v; [...e.currentTarget.children].forEach(c=>c.setAttribute('aria-pressed', c===b)); render();});
document.getElementById('q').addEventListener('input',e=>{query=e.target.value;render();});
document.getElementById('list').addEventListener('click',e=>{const s=e.target.closest('.star');if(!s)return;
  const id=s.dataset.id; const i=fav.indexOf(id); if(i>=0)fav.splice(i,1); else fav.push(id); saveFav();
  if(volet==='fav')render(); else{ const on=fav.indexOf(id)>=0; s.setAttribute('aria-pressed',on); s.textContent=on?'★':'☆'; }});
document.getElementById('copy').addEventListener('click',()=>{const t=document.getElementById('domtext');t.select();
  try{ navigator.clipboard.writeText(t.value); }catch(e){ document.execCommand('copy'); }});

function updateNet(){const on=navigator.onLine;const el=document.getElementById('net');
  el.className='net '+(on?'on':'off'); document.getElementById('netlabel').textContent=on?'En ligne':'Hors-ligne';}
window.addEventListener('online',updateNet); window.addEventListener('offline',updateNet); updateNet();
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} }); }

render();