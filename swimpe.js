/* ==========================================================================
   SWIMPE — moteur commun V10 (partage WhatsApp + OG) (partagé accueil + chiffres)
   - Données embarquées (repli) surchargées par donnees_swimpe.json
   - Adaptation par passeport (langue, devise, voies, chiffres)
   - Chaque bloc est gardé : il ne s'applique que si la page le contient
   - Le choix de passeport est mémorisé (localStorage) entre les pages
   ========================================================================== */

var DONNEES = {
  version: "embarquée",
  maj: "07/08/2026",
  stats: { corridors: "7 440", origines: "249" },
  refus: [["KM","Comores","Comores",55],["GW","Guinée-Bissau","Guiné-Bissau",54.3],["BI","Burundi","Burundi",53.4],["GN","Guinée","Guiné",52.1],["SN","Sénégal","Senegal",51.9],["NG","Nigeria","Nigéria",47.9],["GH","Ghana","Gana",46.5],["AO","Angola","Angola",45.4],["ML","Mali","Mali",42.5],["TG","Togo","Togo",40.2],["DZ","Algérie","Argélia",31],["TN","Tunisie","Tunísia",19.5],["MA","Maroc","Marrocos",19.2],["CN","Chine","China",4]],
  alerte: {
    fr:{t:"Alerte en cours : faux contrats saisonniers pour l'Italie",
        d:"De faux « contrats Flussi » payants circulent sur WhatsApp. Le dépôt authentique s'effectue uniquement via l'employeur, le jour du click-day. Vérifie toute offre ici, gratuitement, avant tout paiement."},
    pt:{t:"Alerta em curso: falsos contratos sazonais para a Itália",
        d:"«Contratos Flussi» pagos circulam no WhatsApp. A candidatura verdadeira passa unicamente pelo empregador no click-day. Verifica qualquer oferta aqui, grátis, antes de pagares a quem quer que seja."}
  },
  origines: {
    SN:{nom:"Sénégal", nom_pt:"Senegal", langues:"fr", devise:"XOF", devise_aff:"XOF", refus:51.9,
        comparer:["GN","NG","ML","MA"],
        implication:"Raison supplémentaire de sécuriser d'abord une voie à forte capacité : la porte GECCO emprunte un circuit dédié et l'Ausbildung un visa long séjour — deux parcours qui contournent le guichet le plus saturé.",
        porte:{tag:"Porte spéciale — canal 100 % gratuit",
               titre:"Espagne · GECCO saisonnier agricole",
               desc:"Recrutement organisé au Sénégal, de 47 à 55 € par jour, pour les 25 à 50 ans justifiant d'une expérience agricole. Candidature via le canal BAOS, sans aucun frais.",
               canal:"Canal officiel unique : BAOS (Espagne–Sénégal). Toute « agence » facturant cette voie relève de l'escroquerie."},
        voies:[
          {p:"forte", t:"Allemagne · Ausbildung", d:"Formation rémunérée de 724 à 1 490 €/mois. Plus de 150 000 places non pourvues chaque année. Seul prérequis déterminant : l'allemand niveau B1."},
          {p:"sel", t:"France · Études", d:"118 000 premiers titres de séjour étudiants en 2025, dont 6 sur 10 délivrés à des ressortissants d'Afrique et du Moyen-Orient. Sélectif, mais à fort volume."},
          {p:"tres", t:"Corée · Bourse GKS", d:"5 à 13 % d'admis, TOPIK niveau 3 requis. À viser en complément d'une voie à forte capacité, jamais en substitution."}
        ]},
    CM:{nom:"Cameroun", nom_pt:"Camarões", langues:"fr", devise:"XAF", devise_aff:"FCFA", refus:null,
        comparer:["NG","GH","TG","ML"],
        implication:"Aucun taux national n'est publié pour le Cameroun, mais les trois motifs ci-dessus s'y appliquent pleinement. À noter : l'Ausbildung relève d'un visa long séjour — un guichet distinct, avec ses propres règles, et un dossier qui se prépare en amont.",
        porte:{tag:"Capacité forte — 150 000+ places non pourvues",
               titre:"Allemagne · Ausbildung, formation rémunérée",
               desc:"De 724 à 1 490 € par mois durant la formation. Seul prérequis déterminant : l'allemand niveau B1 — et on t'indique précisément comment l'atteindre.",
               canal:"Canaux officiels : la Bundesagentur für Arbeit et les établissements eux-mêmes. Aucun intermédiaire n'est requis pour candidater."},
        voies:[
          {p:"sel", t:"France · Études", d:"118 000 premiers titres de séjour étudiants en 2025, dont 6 sur 10 délivrés à des ressortissants d'Afrique et du Moyen-Orient. Sélectif, mais à fort volume."},
          {p:"tres", t:"Japon · Bourse MEXT", d:"2 à 9 % d'admis, quotas par pays. Une voie de complément, jamais un plan principal."},
          {p:"tres", t:"Corée · Bourse GKS", d:"5 à 13 % d'admis, TOPIK niveau 3 requis. La maîtrise de la langue constitue le prérequis premier."}
        ]},
    AO:{nom:"Angola", nom_pt:"Angola", langues:"pt", devise:"AOA", devise_aff:"Kz", refus:45.4,
        comparer:["GW","NG","ML","MA"],
        implication:"Mais uma razão para preferir a via CPLP: entras com o passaporte e pedes o título já em Portugal — sem passar pelo guiché Schengen clássico.",
        porte:{tag:"Porta especial — acordo CPLP",
               titre:"Portugal · residência para países lusófonos",
               desc:"Entras com o passaporte e pedes o título de residência já em Portugal (~15 €). Sem exigência de língua. Um dos canais mais simples do mundo — e os burlões cobram até 500 € por ele.",
               canal:"Canal oficial único: AIMA (Portugal). Qualquer «agência» que cobre por esta via é burla."},
        voies:[
          {p:"forte", t:"Alemanha · Ausbildung", d:"Formação remunerada 724–1 490 €/mês. Mais de 150 000 vagas por preencher por ano. Única portagem: alemão B1."},
          {p:"sel", t:"França · Estudos", d:"118 000 primeiros títulos de estudante em 2025. Selectivo mas massivo."},
          {p:"tres", t:"Coreia · Bolsa GKS", d:"5 a 13 % de admitidos, TOPIK 3 exigido. Tenta-a ALÉM de uma via forte, nunca em vez dela."}
        ]}
  }
};

var I18N = {
  fr:{
    skip:"Aller au contenu",
    det_passeport:"Ton passeport :", det_modifier:"modifier",
    nav_voies:"Tes voies", nav_chiffres:"Les chiffres", nav_arnaque:"Anti-arnaque",
    nav_services:"Accompagnement", nav_espace:"Espace membre",
    badge_gratuit:"Information officielle gratuite, à vie",
    h1_avant:"Ton passeport", h1_apres:"ouvre des portes réelles.",
    hero_sub:"Bourses, formations et emploi à l'étranger, sélectionnés pour ta nationalité. Données officielles, canaux vérifiés, aucune promesse infondée.",
    cta_projet:"Découvrir tes voies", cta_verifier:"Vérifier une offre — gratuit",
    recu_date_l:"vérifié le",
    recu_l1:"Canaux officiels par pays", recu_l2:"Taux de refus réels",
    recu_l3:"Alertes anti-arnaque", recu_l4:"Portes spéciales selon ton passeport",
    recu_total:"TOTAL", recu_stamp:"Gratuit à vie",
    recu_foot:"Sans compte ni paiement · valable indéfiniment",
    recu_comp_s1:"Certaines agences facturent l'accès à ces mêmes informations ",
    recu_comp_m:"jusqu'à 300 000 FCFA",
    recu_comp_s2:". Ce reçu est notre réponse.",
    stat_corridors:"corridors documentés", stat_origines:"pays d'origine couverts",
    stat_gratuit:"pour l'information officielle", stat_sources:"des sources citées",
    voies_eyebrow:"Selon ton passeport", voies_titre:"Tes voies, classées par probabilité réelle.",
    voies_toutes:"Consulter toutes tes voies et répondre au questionnaire →",
    maj_label:"Données vérifiées le",
    p_forte:"Forte capacité", p_sel:"Sélectif", p_tres:"Très sélectif",
    teaser_avec:"de refus Schengen pour ton passeport.", teaser_sans:"Ce qu'on te cache sur les visas.",
    teaser_lien:"Consulter les chiffres que les autres passent sous silence →",
    don_eyebrow:"Transparence intégrale",
    don_titre:"Les chiffres que les autres passent sous silence.",
    don_intro:"Taux de refus de visa Schengen en 2025, par nationalité — communiqués avant tout engagement financier. Un dossier se construit sur des faits, non sur une espérance.",
    dv_refus:"de refus de visa Schengen pour {pays} en 2025",
    dv_sans_n:"3", dv_sans:"motifs expliquent la majorité des refus — et tous trois sont corrigeables",
    motif_1:"Ressources : 21 % des refus", motif_2:"Assurance : 15 %",
    motif_3:"Preuve de retour : 12 %", motif_fix:"Les trois sont corrigeables",
    don_source:"Ordres de grandeur publics — Commission européenne, statistiques visas 2025.",
    charte_eyebrow:"Nos engagements", charte_titre:"Ce que Swimpe ne fera jamais.",
    eng1_t:"Aucun résultat vendu",
    eng1_d:"Nul ne peut garantir une admission ou un visa. Nous facturons un travail de dossier, jamais une promesse.",
    eng2_t:"Aucun classement rémunéré",
    eng2_d:"Aucun établissement, aucun employeur ne peut acheter sa position dans nos classements.",
    eng3_t:"Aucune information sous péage",
    eng3_d:"Canaux officiels, taux réels et anti-arnaque restent gratuits, sans compte ni paiement.",
    regle_or:"« Une bourse authentique n'exige jamais de paiement pour candidater. »",
    retour_voies:"← Retour à tes voies",
    svc_t:"On prépare ton dossier avec toi.",
    svc_d:"Tout ce qui précède reste gratuit, pour toujours. Pour gagner du temps et éviter les erreurs qui mènent à un refus, notre équipe construit ton dossier à tes côtés — tu rémunères notre travail, jamais ta candidature.",
    svc_rappel:"Détail et tarifs sur la page Accompagnement, en toute transparence.",
    svc_btn:"Découvrir l'accompagnement",
    f_slogan:"Le monde, d'un geste.",
    f_disc:"Swimpe informe et accompagne. Nul — ni nous, ni aucune agence — ne peut garantir une admission ou un visa. Méfie-toi de quiconque le promet.",
    f_contact:"Contact WhatsApp",
    ip_prefix:"IP détectée :", langcode:"FR",
    dia_sub:"Depuis l'étranger, pilote le projet d'un proche resté au pays. L'information reste gratuite pour vous deux, chaque étape visible par l'un comme par l'autre.",
    dia_ip:" · profil diaspora détecté",
    esp_demo:"Démonstration de structure — sera reliée à l'application Swimpe",
    esp_titre_conn:"Connexion à ton espace",
    esp_note_conn:"Retrouve tes projets, le suivi de ton dossier et tes voies enregistrées.",
    esp_email:"Adresse e-mail", esp_mdp:"Mot de passe",
    esp_btn_conn:"Se connecter", esp_oubli:"Mot de passe oublié ?", esp_creer:"Créer un compte",
    esp_titre_insc:"Créer ton compte",
    esp_note_insc:"Gratuit. L'information officielle le demeure, avec ou sans compte.",
    esp_mdp2:"Confirme le mot de passe", esp_btn_insc:"Créer mon compte", esp_deja:"J'ai déjà un compte",
    esp_titre_oubli:"Récupération du mot de passe",
    esp_oubli_info:"Tu recevras un code à 6 chiffres par e-mail. Valable 15 minutes, 3 tentatives maximum.",
    esp_btn_code:"Envoyer le code", esp_code:"Code reçu (6 chiffres)",
    esp_nouveau:"Nouveau mot de passe", esp_btn_reinit:"Réinitialiser",
    esp_retour_conn:"← Retour à la connexion",
    esp_bonjour:"Bonjour", esp_mes_projets:"Tes projets", esp_deco:"Se déconnecter",
    esp_statut_prep:"Dossier en préparation", esp_statut_att:"En attente de tes documents",
    esp_etape:"Prochaine étape :", esp_etape_docs:"réunir les pièces du dossier",
    esp_etape_langue:"attester ton niveau de langue",
    esp_vide_t:"Démarrer un nouveau projet",
    esp_vide_d:"Réponds au questionnaire (9 questions) et découvre tes meilleures voies.",
    esp_vide_btn:"Répondre au questionnaire",
    partage_btn:"Partager Swimpe", partage_txt:"Découvre Swimpe — bourses, formations et emploi à l'étranger, avec l'information officielle gratuite à vie :",
    src_json:"données à jour", src_emb:"données embarquées",
    titre_accueil:"Swimpe — Le monde, d'un geste",
    titre_chiffres:"Les chiffres — Swimpe"
  },
  pt:{
    skip:"Ir para o conteúdo",
    det_passeport:"O seu passaporte:", det_modifier:"alterar",
    nav_voies:"As suas vias", nav_chiffres:"Os números", nav_arnaque:"Anti-burla",
    nav_services:"Acompanhamento", nav_espace:"Área de membro",
    badge_gratuit:"Informação oficial gratuita, para sempre",
    h1_avant:"O seu passaporte", h1_apres:"abre portas reais.",
    hero_sub:"Bolsas, formações e emprego no estrangeiro, seleccionados para a sua nacionalidade. Dados oficiais, canais verificados, nenhuma promessa infundada.",
    cta_projet:"Descobrir as suas vias", cta_verifier:"Verificar uma oferta — grátis",
    recu_date_l:"verificado a",
    recu_l1:"Canais oficiais por país", recu_l2:"Taxas de recusa reais",
    recu_l3:"Alertas anti-burla", recu_l4:"Portas especiais segundo o seu passaporte",
    recu_total:"TOTAL", recu_stamp:"Grátis para sempre",
    recu_foot:"Sem conta nem pagamento · válido indefinidamente",
    recu_comp_s1:"Algumas agências cobram o acesso a estas mesmas informações ",
    recu_comp_m:"até 300 000 FCFA",
    recu_comp_s2:". Este recibo é a nossa resposta.",
    stat_corridors:"corredores documentados", stat_origines:"países de origem cobertos",
    stat_gratuit:"pela informação oficial", stat_sources:"das fontes citadas",
    voies_eyebrow:"Segundo o seu passaporte", voies_titre:"As suas vias, ordenadas por probabilidade real.",
    voies_toutes:"Consultar todas as suas vias e responder ao questionário →",
    maj_label:"Dados verificados a",
    p_forte:"Forte capacidade", p_sel:"Selectivo", p_tres:"Muito selectivo",
    teaser_avec:"de recusas Schengen para o seu passaporte.", teaser_sans:"O que lhe escondem sobre os vistos.",
    teaser_lien:"Consultar os números que os outros silenciam →",
    don_eyebrow:"Transparência integral",
    don_titre:"Os números que os outros silenciam.",
    don_intro:"Taxas de recusa de visto Schengen em 2025, por nacionalidade — comunicadas antes de qualquer compromisso financeiro. Um processo constrói-se sobre factos, não sobre uma esperança.",
    dv_refus:"de recusas de visto Schengen para {pays} em 2025",
    dv_sans_n:"3", dv_sans:"motivos explicam a maioria das recusas — e todos os três são corrigíveis",
    motif_1:"Recursos: 21 % das recusas", motif_2:"Seguro: 15 %",
    motif_3:"Prova de retorno: 12 %", motif_fix:"Os três são corrigíveis",
    don_source:"Ordens de grandeza públicas — Comissão Europeia, estatísticas de vistos 2025.",
    charte_eyebrow:"Os nossos compromissos", charte_titre:"O que a Swimpe nunca fará.",
    eng1_t:"Nenhum resultado vendido",
    eng1_d:"Ninguém pode garantir uma admissão ou um visto. Cobramos um trabalho de processo, nunca uma promessa.",
    eng2_t:"Nenhum ranking remunerado",
    eng2_d:"Nenhum estabelecimento, nenhum empregador pode comprar a sua posição nos nossos rankings.",
    eng3_t:"Nenhuma informação com portagem",
    eng3_d:"Canais oficiais, taxas reais e anti-burla permanecem gratuitos, sem conta nem pagamento.",
    regle_or:"«Uma bolsa autêntica nunca exige pagamento para se candidatar.»",
    retour_voies:"← Voltar às suas vias",
    svc_t:"Preparamos o seu processo consigo.",
    svc_d:"Tudo o que precede permanece gratuito, indefinidamente. Para ganhar tempo e evitar os erros que conduzem a uma recusa, a nossa equipa constrói o seu processo ao seu lado — remunera o nosso trabalho, nunca a sua candidatura.",
    svc_rappel:"Detalhes e preços na página Acompanhamento, com total transparência.",
    svc_btn:"Descobrir o acompanhamento",
    f_slogan:"O mundo, num gesto.",
    f_disc:"A Swimpe informa e acompanha. Ninguém — nem nós, nem agência alguma — pode garantir uma admissão ou um visto. Desconfie de quem o prometer.",
    f_contact:"Contacto WhatsApp",
    ip_prefix:"IP detectada:", langcode:"PT",
    dia_sub:"A partir do estrangeiro, conduza o projecto de um familiar no país. A informação permanece gratuita para ambos, cada etapa visível por um e por outro.",
    dia_ip:" · perfil diáspora detectado",
    esp_demo:"Demonstração de estrutura — será ligada à aplicação Swimpe",
    esp_titre_conn:"Entrar na sua área",
    esp_note_conn:"Reencontre os seus projectos, o acompanhamento do processo e as suas vias guardadas.",
    esp_email:"Endereço de e-mail", esp_mdp:"Palavra-passe",
    esp_btn_conn:"Entrar", esp_oubli:"Esqueceu a palavra-passe?", esp_creer:"Criar uma conta",
    esp_titre_insc:"Criar a sua conta",
    esp_note_insc:"Grátis. A informação oficial permanece gratuita, com ou sem conta.",
    esp_mdp2:"Confirme a palavra-passe", esp_btn_insc:"Criar a minha conta", esp_deja:"Já tenho conta",
    esp_titre_oubli:"Recuperação da palavra-passe",
    esp_oubli_info:"Receberá um código de 6 dígitos por e-mail. Válido 15 minutos, 3 tentativas no máximo.",
    esp_btn_code:"Enviar o código", esp_code:"Código recebido (6 dígitos)",
    esp_nouveau:"Nova palavra-passe", esp_btn_reinit:"Redefinir",
    esp_retour_conn:"← Voltar à entrada",
    esp_bonjour:"Olá", esp_mes_projets:"Os seus projectos", esp_deco:"Sair",
    esp_statut_prep:"Processo em preparação", esp_statut_att:"A aguardar os seus documentos",
    esp_etape:"Próxima etapa:", esp_etape_docs:"reunir os documentos do processo",
    esp_etape_langue:"comprovar o seu nível de língua",
    esp_vide_t:"Iniciar um novo projecto",
    esp_vide_d:"Responda ao questionário (9 perguntas) e descubra as suas melhores vias.",
    esp_vide_btn:"Responder ao questionário",
    partage_btn:"Partilhar a Swimpe", partage_txt:"Descobre a Swimpe — bolsas, formações e emprego no estrangeiro, com informação oficial gratuita para sempre:",
    src_json:"dados actualizados", src_emb:"dados incorporados",
    titre_accueil:"Swimpe — O mundo, num gesto",
    titre_chiffres:"Os números — Swimpe"
  }
};

function detecterPays(){
  var b=document.body;
  return {pays:b.getAttribute('data-ip-pays')||"FR",
          ville:b.getAttribute('data-ip-ville')||"Paris",
          nomPays:b.getAttribute('data-ip-nom')||"France"};
}
var IP = detecterPays();
var REGIONS_HORS_AFRIQUE = {FR:1,BE:1,DE:1,IT:1,ES:1,PT:1,GB:1,US:1,CA:1};
var PASSEPORT_ACTUEL = "SN";
var SOURCE_DONNEES = "emb";
var PAGE = document.body.getAttribute("data-page") || "accueil";

function profil(iso_ip, iso_passeport){
  var o = DONNEES.origines[iso_passeport] || DONNEES.origines.SN;
  return { passeport: iso_passeport, origine: o,
           langue: o.langues === "pt" ? "pt" : "fr",
           diaspora: !!REGIONS_HORS_AFRIQUE[iso_ip] };
}
function t(L, cle){ return (I18N[L] && I18N[L][cle]) || I18N.fr[cle] || ""; }
function tous(sel){ return document.querySelectorAll(sel); }
function el(id){ return document.getElementById(id); }
function pose(id, txt){ var e=el(id); if(e) e.textContent=txt; }
function poserTexte(sel, txt){ var e=tous(sel); for(var i=0;i<e.length;i++) e[i].textContent=txt; }
function ech(s){ var d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

function appliquer(iso_passeport){
  PASSEPORT_ACTUEL = iso_passeport;
  var p = profil(IP.pays, iso_passeport);
  var L = p.langue, o = p.origine, dic = I18N[L];

  document.documentElement.lang = L;
  var els = tous("[data-i]");
  for (var i=0;i<els.length;i++){
    var cle = els[i].getAttribute("data-i");
    if (dic[cle]) els[i].textContent = dic[cle];
  }

  pose("ipline", t(L,"ip_prefix")+" "+IP.ville+", "+IP.nomPays+(p.diaspora ? t(L,"dia_ip") : ""));
  pose("det-pays", (L==="pt" ? o.nom_pt : o.nom));
  pose("h1-pays", (L==="pt" ? o.nom_pt : o.nom));
  if (p.diaspora) pose("hero-sub", t(L,"dia_sub"));

  poserTexte(".js-dev", o.devise_aff);
  poserTexte(".js-maj", DONNEES.maj);
  pose("stat-corridors", DONNEES.stats.corridors);
  pose("stat-origines", DONNEES.stats.origines);

  /* --- blocs de la page ACCUEIL ------------------------------------------ */
  if (el("porte-tag")){
    pose("porte-tag", o.porte.tag);
    pose("porte-titre", o.porte.titre);
    pose("porte-desc", o.porte.desc);
    pose("porte-canal-txt", o.porte.canal);
  }
  if (el("voies-grille")){
    var g = el("voies-grille");
    g.innerHTML = "";
    var voies = o.voies || [];
    for (var v=0; v<voies.length; v++){
      var vo = voies[v];
      var lp = vo.p==="forte" ? t(L,"p_forte") : (vo.p==="sel" ? t(L,"p_sel") : t(L,"p_tres"));
      var carteV = document.createElement("div");
      carteV.className = "voie";
      carteV.innerHTML =
        '<span class="past '+vo.p+'"><span class="pt"></span>'+ech(lp)+'</span>'+
        '<h4>'+ech(vo.t)+'</h4><p>'+ech(vo.d)+'</p>';
      g.appendChild(carteV);
    }
  }
  if (el("teaser-n")){
    if (o.refus !== null){
      pose("teaser-n", String(o.refus).replace(".",",")+" %");
      pose("teaser-txt", t(L,"teaser_avec"));
    } else {
      pose("teaser-n", "3×");
      pose("teaser-txt", t(L,"teaser_sans"));
    }
  }

  /* --- blocs de la page CHIFFRES ----------------------------------------- */
  if (el("al-t")){
    var al = DONNEES.alerte[L] || DONNEES.alerte.fr;
    pose("al-t", al.t); pose("al-d", al.d);
  }
  if (el("dv-n")){
    var carte = {};
    for (var r=0;r<DONNEES.refus.length;r++){ carte[DONNEES.refus[r][0]] = DONNEES.refus[r]; }
    if (o.refus !== null){
      pose("dv-n", String(o.refus).replace(".",",")+" %");
      pose("dv-l", t(L,"dv_refus").replace("{pays}", (L==="pt"?o.nom_pt:o.nom)));
    } else {
      pose("dv-n", t(L,"dv_sans_n"));
      pose("dv-l", t(L,"dv_sans"));
    }
    var conteneur = el("barres");
    conteneur.innerHTML = "";
    var liste = [];
    if (o.refus !== null) liste.push([iso_passeport, o.nom, o.nom_pt, o.refus]);
    var comp = o.comparer || [];
    for (var c=0;c<comp.length;c++){
      if (comp[c]!==iso_passeport && carte[comp[c]]) liste.push(carte[comp[c]]);
    }
    for (var k=0;k<liste.length;k++){
      var d = liste[k];
      var nomLoc = (L==="pt" && d[2]) ? d[2] : d[1];
      var taux = d[3];
      var ligne = document.createElement("div");
      ligne.className = "barre" + (taux < 30 ? " ok" : "") + (d[0]===iso_passeport ? " moi" : "");
      ligne.innerHTML =
        '<span class="p">'+ech(nomLoc)+'</span>'+
        '<span class="t"><span class="f" data-w="'+taux+'"></span></span>'+
        '<span class="v">'+String(taux).replace(".",",")+'&nbsp;%</span>';
      conteneur.appendChild(ligne);
    }
    animerBarres();
    pose("don-implication", o.implication || "");
  }

  /* --- blocs de la page MON ESPACE --------------------------------------- */
  if (el("vue-espace")){
    var session = null;
    try{ session = localStorage.getItem("swimpe_demo_session"); }catch(e){}
    basculerVue(session ? "espace" : "connexion");
    if (session){
      pose("esp-nom", session.split("@")[0] || session);
      var zone = el("projets");
      zone.innerHTML = "";
      var pr = [
        {t:(o.porte&&o.porte.titre)||"", s:"prep", pc:60, e:t(L,"esp_etape_docs")},
        {t:(o.voies && o.voies[0]) ? o.voies[0].t : "", s:"att", pc:25, e:t(L,"esp_etape_langue")}
      ];
      for (var q=0;q<pr.length;q++){
        if (!pr[q].t) continue;
        var card = document.createElement("div");
        card.className = "projet";
        card.innerHTML =
          '<div class="haut"><h3>'+ech(pr[q].t)+'</h3>'+
          '<span class="statut'+(pr[q].s==="att"?" att":"")+'">'+
          ech(t(L, pr[q].s==="att" ? "esp_statut_att" : "esp_statut_prep"))+'</span></div>'+
          '<div class="avance"><span style="width:'+pr[q].pc+'%"></span></div>'+
          '<p class="etape">'+ech(t(L,"esp_etape"))+' '+ech(pr[q].e)+'</p>';
        zone.appendChild(card);
      }
      var vide = document.createElement("div");
      vide.className = "projet vide";
      vide.innerHTML = '<h3>'+ech(t(L,"esp_vide_t"))+'</h3><p>'+ech(t(L,"esp_vide_d"))+'</p>'+
        '<a class="btn btn-ligne" href="#">'+ech(t(L,"esp_vide_btn"))+'</a>';
      zone.appendChild(vide);
    }
  }

  if (window.__lang_sel !== L){ window.__lang_sel = L; remplirSelecteur(); var s2=el("sel-passeport"); if(s2) s2.value = iso_passeport; }

  var srcEl = el("src-donnees");
  if (srcEl) srcEl.textContent =
    (SOURCE_DONNEES==="json" ? t(L,"src_json") : t(L,"src_emb")) + " · v " + DONNEES.version;

  try{ localStorage.setItem("swimpe_passeport", iso_passeport); }catch(e){}
  var sel = el("sel-passeport"); if (sel) sel.value = iso_passeport;
  pose("langline", t(L,"langcode"));
  document.title = t(L, PAGE==="chiffres" ? "titre_chiffres" : "titre_accueil");
}

var RECU_JOUE = false;
function animerRecu(){
  var elN = el("recu-total-n"), tampon = el("tampon");
  if (!elN || RECU_JOUE) return; RECU_JOUE = true;
  var reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduit){ elN.textContent="0"; tampon.classList.remove("avant"); return; }
  var debut=300000, t0=null, duree=1700;
  function pas(ts){
    if(!t0) t0=ts;
    var pr=Math.min((ts-t0)/duree,1);
    var e=1-Math.pow(1-pr,3);
    var v=Math.round(debut*(1-e));
    elN.textContent = v.toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g," ");
    if (pr<1) requestAnimationFrame(pas);
    else { elN.textContent="0"; tampon.classList.remove("avant"); }
  }
  requestAnimationFrame(pas);
}
function animerBarres(){
  var fils = tous(".barre .f"), zone = el("barres");
  if (!zone) return;
  var lancer = function(){ for (var i=0;i<fils.length;i++){ fils[i].style.width = fils[i].getAttribute("data-w")+"%"; } };
  if ("IntersectionObserver" in window){
    var obs = new IntersectionObserver(function(entries){
      for (var i=0;i<entries.length;i++){ if(entries[i].isIntersecting){ lancer(); obs.disconnect(); } }
    },{threshold:.3});
    obs.observe(zone);
  } else { lancer(); }
}

function fusionner(cible, src){
  for (var k in src){
    if (Object.prototype.toString.call(src[k])==="[object Object]" && cible[k]){ fusionner(cible[k], src[k]); }
    else { cible[k]=src[k]; }
  }
}
function chargerDonnees(){
  if (location.protocol==="file:") return;
  fetch("donnees_swimpe.json?t="+Date.now(), {cache:"no-store"})
    .then(function(r){ if(!r.ok) throw 0; return r.json(); })
    .then(function(json){ fusionner(DONNEES, json); SOURCE_DONNEES="json"; remplirSelecteur();
      var v = window.__passeport_voulu;
      appliquer(v && DONNEES.origines[v] ? v : PASSEPORT_ACTUEL); })
    .catch(function(){ /* repli embarqué, voulu */ });
}

(function(){
  var cibles = tous(".rv");
  if (!("IntersectionObserver" in window)){
    for (var i=0;i<cibles.length;i++) cibles[i].classList.add("in");
    animerRecu(); return;
  }
  var obs = new IntersectionObserver(function(entries){
    for (var i=0;i<entries.length;i++){
      if (entries[i].isIntersecting){
        entries[i].target.classList.add("in");
        if (entries[i].target.id==="recu") animerRecu();
        obs.unobserve(entries[i].target);
      }
    }
  },{threshold:.12});
  for (var i=0;i<cibles.length;i++) obs.observe(cibles[i]);
})();

function basculerVue(nom){
  var vues = ["connexion","inscription","oubli","espace"];
  for (var i=0;i<vues.length;i++){
    var v = el("vue-"+vues[i]);
    if (v) v.hidden = (vues[i] !== nom);
  }
}
(function(){
  if (!el("vue-connexion")) return;
  function ouvrirSession(email){
    try{ localStorage.setItem("swimpe_demo_session", email || "membre"); }catch(e){}
    appliquer(PASSEPORT_ACTUEL);
    window.scrollTo(0,0);
  }
  el("btn-connexion").addEventListener("click", function(){
    ouvrirSession((el("conn-email").value||"").trim() || "membre");
  });
  el("btn-inscription").addEventListener("click", function(){
    ouvrirSession((el("insc-email").value||"").trim() || "membre");
  });
  el("lien-oubli").addEventListener("click", function(){ basculerVue("oubli"); });
  el("lien-inscription").addEventListener("click", function(){ basculerVue("inscription"); });
  var retours = tous(".retour-conn");
  for (var i=0;i<retours.length;i++){
    retours[i].addEventListener("click", function(){ basculerVue("connexion"); });
  }
  el("btn-code").addEventListener("click", function(){ el("oubli-suite").hidden = false; });
  el("btn-reinit").addEventListener("click", function(){ basculerVue("connexion"); });
  el("btn-deco").addEventListener("click", function(){
    try{ localStorage.removeItem("swimpe_demo_session"); }catch(e){}
    appliquer(PASSEPORT_ACTUEL);
  });
})();

(function(){
  var bp = el("btn-partage");
  if (!bp) return;
  bp.addEventListener("click", function(){
    var L = document.documentElement.lang === "pt" ? "pt" : "fr";
    var texte = t(L,"partage_txt") + " https://swimpe.com";
    if (navigator.share){
      navigator.share({title:"Swimpe", text:t(L,"partage_txt"), url:"https://swimpe.com"}).catch(function(){});
    } else {
      window.open("https://wa.me/?text=" + encodeURIComponent(texte), "_blank", "noopener");
    }
  });
})();

function remplirSelecteur(){
  var sel = el("sel-passeport");
  if (!sel) return;
  var L = document.documentElement.lang === "pt" ? "pt" : "fr";
  var actuel = sel.value || PASSEPORT_ACTUEL;
  // Trier les pays par nom localisé
  var codes = Object.keys(DONNEES.origines).sort(function(a,b){
    var na = (L==="pt" ? DONNEES.origines[a].nom_pt : DONNEES.origines[a].nom) || a;
    var nb = (L==="pt" ? DONNEES.origines[b].nom_pt : DONNEES.origines[b].nom) || b;
    return na.localeCompare(nb, L);
  });
  sel.innerHTML = "";
  for (var i=0;i<codes.length;i++){
    var c = codes[i], o = DONNEES.origines[c];
    var opt = document.createElement("option");
    opt.value = c;
    opt.textContent = (L==="pt" && o.nom_pt) ? o.nom_pt : o.nom;
    sel.appendChild(opt);
  }
  if (DONNEES.origines[actuel]) sel.value = actuel;
}

(function(){
  var sel = el("sel-passeport");
  if (sel) sel.addEventListener("change", function(){ window.__passeport_voulu = this.value; appliquer(this.value); });
  var burger = el("btn-menu");
  if (burger) burger.addEventListener("click", function(){
    var m = el("menu"); if(!m) return;
    var o = m.classList.toggle("open");
    this.setAttribute("aria-expanded", o);
  });
  var h1btn = el("h1-pays");
  if (h1btn && sel) h1btn.addEventListener("click", function(){
    if (sel.showPicker) { try { sel.showPicker(); return; } catch(e){} }
    sel.focus(); sel.click();
  });
  var memoire = null;
  try{ memoire = localStorage.getItem("swimpe_passeport"); }catch(e){}
  window.__passeport_voulu = memoire;
  remplirSelecteur();
  appliquer(memoire && DONNEES.origines[memoire] ? memoire : (DONNEES.origines[IP.pays] ? IP.pays : "SN"));
  chargerDonnees();
  setInterval(chargerDonnees, 15*60*1000);
})();
