// Les données (CATS, SHORT, CDESC, ORDER, D, AFFICHER_INTERNATIONAL) sont dans donnees.js, chargé avant ce fichier.
// LISTE = les fiches montrées dans la liste : sans les fiches « international » tant qu'AFFICHER_INTERNATIONAL est false.
const LISTE=D.filter(r=>AFFICHER_INTERNATIONAL||r[6]!=='inter');
let filter="all", volet="all", query="", compOnly=false, compDom="all", page=1;
const PAR_PAGE=20; // fiches affichées par page : la liste complète (300+ fiches) était trop longue à faire défiler
let fav=[]; try{ fav=JSON.parse(localStorage.getItem('swimpe_fav')||'[]'); }catch(e){ fav=[]; }
const idOf=r=>r[1];

// 🏆 Compétitions de TOUS les domaines (cinéma, musique, mode, écriture, sciences, tech, entrepreneuriat, sport…).
// Une fiche compte comme compétition si : elle est dans « Olympiades », ou si son nom/type (catégories Concours, Sport,
// Arts) parle de festival, prix, concours, compétition, hackathon, biennale, tournoi, jeux… Les « concours » d'État
// (admission, fonction publique) sont des examens : ils restent dans « Public » et ne comptent pas ici.
// Pour ajouter une compétition dans un autre domaine : la mettre dans Concours/Sport/Arts avec un type contenant l'un de ces mots,
// ou l'ajouter à COMP_EXTRA (nom exact de la fiche).
const COMP_CATS=new Set(["concours","sport","arts"]);
const COMP_RE=/festival|comp[ée]tition|olympiad|concours|\bprix\b|prize|award|hackathon|biennale|tournoi|championnat|\bcoupe\b|\bjeux\b|challenge|quiz|troph[ée]e/i;
const COMP_EXTRA=new Set([]);
const estCompetition=r=>r[0]==='olympiades'||COMP_EXTRA.has(r[1])||(COMP_CATS.has(r[0])&&COMP_RE.test(r[1]+' '+r[3]));

// Sous-filtre des compétitions : le DOMAINE (sciences, cinéma, musique, sport…).
// Chaque compétition est rangée dans un domaine par son nom exact (COMP_DOM_NOM). Une nouvelle fiche non listée est rangée
// d'après les mots de son nom/type (COMP_DOM_MOTS) ; sans correspondance, elle va dans « Autres domaines ».
const COMP_DOMS=[["sciences","🔬 Sciences & maths"],["tech","💻 Informatique & tech"],["entre","🚀 Entrepreneuriat"],
  ["cine","🎬 Cinéma"],["musique","🎵 Musique"],["arts","🎨 Arts visuels & mode"],["ecrit","✍️ Écriture & médias"],
  ["sport","⚽ Sport"],["culture","🌍 Culture & jeux"],["autres","🌐 Autres domaines"]];
const COMP_DOM_NOM={
  "Olympiade Maths (IMO)":"sciences","Olympiade Panafricaine Maths (PAMO)":"sciences","Olympiades Francophonie Maths":"sciences",
  "Olympiade Physique (IPhO)":"sciences","Olympiade Biologie (IBO)":"sciences","Olympiade Chimie (IChO)":"sciences",
  "Olympiade Géographie (iGeo)":"sciences","Concours Kangourou":"sciences","IMC (maths université)":"sciences",
  "iGEM (bio synthèse)":"sciences","L'Oréal-UNESCO Femmes & Science":"sciences",
  "Olympiade Informatique (IOI)":"tech","ICPC (programmation)":"tech","Microsoft Imagine Cup":"tech","AfricaTech Awards (VivaTech)":"tech",
  "Orange POESAM":"entre","TotalEnergies Startupper":"entre","Africa's Business Heroes":"entre","Seedstars":"entre",
  "Anzisha Prize":"entre","Hult Prize":"entre","MEST Africa":"entre",
  "FESPACO (Ouagadougou)":"cine","Festival Écrans Noirs (Yaoundé)":"cine","Clap Ivoire":"cine","Dakar Court":"cine",
  "Prix Découvertes RFI":"musique","Orange Music Talents":"musique",
  "Dak'Art — Biennale de Dakar":"arts","Rencontres de Bamako (photo)":"arts","FIMA (mode, Niger)":"arts",
  "Queen's Commonwealth Essay":"ecrit","UPU Letter-Writing (jeunes)":"ecrit","Prix Ahmadou Kourouma":"ecrit",
  "Prix des cinq continents (Francophonie)":"ecrit","Queen's Commonwealth Writing Competition":"ecrit",
  "Thomson Foundation":"ecrit","Prix UNESCO (presse, alphabétisation, filles)":"ecrit",
  "Génies en Herbe":"culture","Jeux de la Francophonie":"culture"
};
const COMP_DOM_MOTS=[["cine",/cin[ée]ma|film|m[ée]trage|audiovisuel|documentaire/i],["musique",/musi(c|que)|chant|chanson/i],
  ["ecrit",/litt[ée]rai|[ée]criture|[ée]crit|r[ée]daction|essay|writing|po[ée]sie|journalis|presse/i],
  ["tech",/informatique|programmation|hackathon|\btech\b|coding|num[ée]rique/i],
  ["sciences",/maths?\b|physique|chimie|biolog|science|g[ée]ographie|olympiad/i],
  ["entre",/startup|entrepreneu|business|innovation|incubat/i],
  ["arts",/\bart\b|arts\b|photo|\bmode\b|design|biennale|peinture|danse|th[ée][aâ]tre/i],
  ["sport",/sport|football|basket|handball|volley|athl[ée]tisme|jeux olympiques/i]];
function domaineComp(r){
  if(r[0]==='sport') return 'sport';
  if(COMP_DOM_NOM[r[1]]) return COMP_DOM_NOM[r[1]];
  const t=r[1]+' '+r[3];
  for(const m of COMP_DOM_MOTS){ if(m[1].test(t)) return m[0]; }
  return 'autres';
}
const saveFav=()=>{ try{ localStorage.setItem('swimpe_fav', JSON.stringify(fav)); }catch(e){} };

const totals={}; LISTE.forEach(r=>{ totals[r[0]]=(totals[r[0]]||0)+1; });
const comps=LISTE.filter(estCompetition);
const nComp=comps.length; document.getElementById('ncomp').textContent=nComp;
const parDom={}; comps.forEach(r=>{ const d=domaineComp(r); parDom[d]=(parDom[d]||0)+1; });
const catsEl=document.getElementById('cats');
catsEl.innerHTML='<button class="chip" data-f="all" aria-pressed="true">Tout <span class="n">'+LISTE.length+'</span></button>'+
  ORDER.filter(c=>totals[c]).map(c=>'<button class="chip" data-f="'+c+'" aria-pressed="false">'+SHORT[c]+' <span class="n">'+(totals[c]||0)+'</span></button>').join('');
const domsEl=document.getElementById('doms');
domsEl.innerHTML='<span class="seglabel">Domaine :</span><button class="seg" data-d="all" aria-pressed="true">Tous <span class="n">'+nComp+'</span></button>'+
  COMP_DOMS.filter(d=>parDom[d[0]]).map(d=>'<button class="seg" data-d="'+d[0]+'" aria-pressed="false">'+d[1]+' <span class="n">'+parDom[d[0]]+'</span></button>').join('');

// Le domaine de chaque fiche est un lien qui ouvre le site (nouvel onglet). Pas de lien pour les fiches « Risqué »
// (on n'envoie pas vers un site classé à risque) ni quand le domaine n'est pas encore connu (« à confirmer »).
const DOM_OK=/^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}(\/[^\s"<>]*)?$/i;
function lienDomaine(r){
  const d=r[2];
  if(r[4]!=='risque' && DOM_OK.test(d)) return '<a class="dom dom--lien" href="https://'+d+'" target="_blank" rel="noopener noreferrer" aria-label="Ouvrir '+d+' dans un nouvel onglet">'+d+' <span aria-hidden="true">↗</span></a>';
  return '<div class="dom">'+d+(r[4]==='risque'?' <span class="dom-off">· lien non proposé</span>':'')+'</div>';
}
function fiab(f){ if(f==='officiel')return '<span class="badge b-off">Officiel</span>';
  if(f==='averifier')return '<span class="badge b-ver">À vérifier</span>';
  if(f==='risque')return '<span class="badge b-ris">Risqué</span>';
  return '<span class="badge b-itm">Intermédiaire</span>'; }

function render(){
  const q=query.trim().toLowerCase();
  // Classées par catégorie (dans l'ordre de ORDER) : la pagination découpe cette liste en tranches de PAR_PAGE fiches.
  const rows=LISTE.filter(r=>{
    if(filter!=='all' && r[0]!==filter) return false;
    if(compOnly && !estCompetition(r)) return false;
    if(compOnly && compDom!=='all' && domaineComp(r)!==compDom) return false;
    if(volet==='local' && r[6]!=='local') return false;
    if(volet==='inter' && r[6]!=='inter') return false;
    if(volet==='fav' && fav.indexOf(idOf(r))<0) return false;
    if(q){ const hay=(r[1]+' '+r[2]+' '+r[3]+' '+r[5]).toLowerCase(); if(hay.indexOf(q)<0) return false; }
    return true;
  }).sort((a,b)=>ORDER.indexOf(a[0])-ORDER.indexOf(b[0]));
  const nbPages=Math.max(1,Math.ceil(rows.length/PAR_PAGE));
  if(page>nbPages) page=nbPages; if(page<1) page=1;
  const debut=(page-1)*PAR_PAGE, visibles=rows.slice(debut,debut+PAR_PAGE);
  const domLabel=(COMP_DOMS.find(d=>d[0]===compDom)||[])[1];
  document.getElementById('count').textContent=rows.length+' organisme'+(rows.length>1?'s':'')+
    (volet==='fav'?' sélectionné'+(rows.length>1?'s':''):'')+(filter!=='all'?' · '+CATS[filter]:'')+
    (volet==='local'?' · 🏠 Local':volet==='inter'?' · ✈️ International':'')+(compOnly?' · 🏆 Compétitions'+(compDom!=='all'&&domLabel?' · '+domLabel:''):'');
  document.getElementById('compnote').hidden=!compOnly;
  domsEl.hidden=!compOnly;
  const list=document.getElementById('list');
  if(!rows.length){ list.innerHTML='<div class="empty">'+(volet==='fav'?'Aucune sélection pour l\'instant. Touche ⭐ sur un organisme pour le garder ici.':'Aucun résultat pour ces filtres.')+'</div>'; }
  else{
    const totalCat={}; rows.forEach(r=>{ totalCat[r[0]]=(totalCat[r[0]]||0)+1; });
    const dejaCommence=new Set(rows.slice(0,debut).map(r=>r[0])); // catégories entamées sur une page précédente
    let html='';
    ORDER.forEach(cat=>{
      const sub=visibles.filter(r=>r[0]===cat); if(!sub.length) return;
      const suite=dejaCommence.has(cat);
      html+='<section class="cat"><h2>'+CATS[cat]+' <span class="cc">'+totalCat[cat]+'</span>'+(suite?' <span class="suite">suite</span>':'')+'</h2>'+(suite?'':'<p class="cdesc">'+CDESC[cat]+'</p>');
      sub.forEach(r=>{
        const on=fav.indexOf(idOf(r))>=0;
        html+='<div class="card"><div class="body"><h3>'+r[1]+'</h3>'+lienDomaine(r)+'<p><b style="color:var(--fg);font-weight:600">'+r[3]+'</b> — '+r[5]+'</p>'+
          '<div class="row">'+fiab(r[4])+'<span class="badge '+(r[6]==='local'?'b-loc">🏠 Local':'b-int">✈️ International')+'</span></div></div>'+
          '<button class="star" data-id="'+r[1].replace(/"/g,'&quot;')+'" aria-pressed="'+on+'" title="Sélectionner">'+(on?'★':'☆')+'</button></div>';
      });
      html+='</section>';
    });
    if(nbPages>1){
      html+='<nav class="pager" aria-label="Pages de la liste"><div class="pginfo">Page '+page+' sur '+nbPages+' · fiches '+(debut+1)+'–'+(debut+visibles.length)+' sur '+rows.length+'</div>'+
        '<button class="pg" data-pg="prev"'+(page<=1?' disabled':'')+'>← Précédent</button>'+
        '<button class="pg pg--suiv" data-pg="next"'+(page>=nbPages?' disabled':'')+'>Suivant →</button>'+
        '<button class="pg pg--haut" data-pg="haut">↑ Filtres</button></nav>';
    }
    list.innerHTML=html;
  }
  const doms=[...new Set(rows.filter(r=>r[4]==='officiel'&&r[2]&&r[2].indexOf(' ')<0&&r[2].indexOf('.')>0).map(r=>r[2]))];
  document.getElementById('domtext').value=doms.join('\n');
}

// Après un changement de filtre ou de recherche : on repart de la page 1.
function appliquer(){ page=1; render(); }
// Après un changement de page : on remonte en haut de la liste (sous la barre de recherche collée en haut).
function versLeHautDeLaListe(){
  const cible=document.getElementById('count'), barre=document.querySelector('.controls');
  window.scrollTo({top:Math.max(0,cible.getBoundingClientRect().top+window.scrollY-(barre?barre.offsetHeight:0)-10),behavior:'instant'}); // d'un coup : la liste vient d'être remplacée
}
function etatBoutons(){
  [...catsEl.children].forEach(c=>c.setAttribute('aria-pressed', c.dataset.f===filter));
  [...document.getElementById('volets').children].forEach(c=>c.setAttribute('aria-pressed', c.dataset.v===volet));
  document.querySelector('#types .seg').setAttribute('aria-pressed',compOnly);
  [...domsEl.querySelectorAll('.seg')].forEach(c=>c.setAttribute('aria-pressed', c.dataset.d===compDom));
}

catsEl.addEventListener('click',e=>{const b=e.target.closest('.chip');if(!b)return;
  filter=b.dataset.f; etatBoutons(); appliquer();});
document.getElementById('volets').addEventListener('click',e=>{const b=e.target.closest('.seg');if(!b)return;
  volet=b.dataset.v; etatBoutons(); appliquer();});
document.getElementById('types').addEventListener('click',e=>{const b=e.target.closest('.seg');if(!b)return;
  compOnly=!compOnly; compDom='all'; etatBoutons(); appliquer();});
domsEl.addEventListener('click',e=>{const b=e.target.closest('.seg');if(!b)return;
  compDom=b.dataset.d; etatBoutons(); appliquer();});
document.getElementById('q').addEventListener('input',e=>{query=e.target.value;appliquer();});
document.getElementById('list').addEventListener('click',e=>{
  const g=e.target.closest('.pg');
  if(g&&!g.disabled){
    if(g.dataset.pg==='haut'){ window.scrollTo({top:0}); return; }
    page+=g.dataset.pg==='next'?1:-1; render(); versLeHautDeLaListe(); return;
  }
  const s=e.target.closest('.star');if(!s)return;
  const id=s.dataset.id; const i=fav.indexOf(id); if(i>=0)fav.splice(i,1); else fav.push(id); saveFav();
  if(volet==='fav')render(); else{ const on=fav.indexOf(id)>=0; s.setAttribute('aria-pressed',on); s.textContent=on?'★':'☆'; }});
document.getElementById('copy').addEventListener('click',()=>{const t=document.getElementById('domtext');t.select();
  try{ navigator.clipboard.writeText(t.value); }catch(e){ document.execCommand('copy'); }});

// Bouton « ← Retour » : revient à la page d'où l'on vient (site Swimpe ou application) ; sinon (page ouverte directement,
// application installée sur l'écran d'accueil) il mène à l'accueil du site. Sans JavaScript, le lien mène à l'accueil.
document.getElementById('retour').addEventListener('click',e=>{
  try{
    if(document.referrer && history.length>1){
      const h=new URL(document.referrer).hostname;
      if(h===location.hostname || /(^|\.)swimpe\.com$/.test(h)){ e.preventDefault(); history.back(); }
    }
  }catch(err){}
});

// Liens directs depuis d'autres pages : /annuaire/?cat=sport · ?comp=1 · ?comp=1&dom=cine · ?v=local · ?q=football
try{
  const sp=new URLSearchParams(location.search);
  const c=sp.get('cat'); if(c && CATS[c] && totals[c]) filter=c;
  if(sp.get('comp')==='1') compOnly=true;
  const d=sp.get('dom'); if(compOnly && d && parDom[d]) compDom=d;
  const v=sp.get('v'); if(v==='fav'||(AFFICHER_INTERNATIONAL&&(v==='local'||v==='inter'))) volet=v;
  const q=sp.get('q'); if(q){ query=q.slice(0,80); document.getElementById('q').value=query; }
}catch(e){}
if(!AFFICHER_INTERNATIONAL){ document.querySelectorAll('#volets [data-v="local"],#volets [data-v="inter"]').forEach(b=>b.remove()); }
etatBoutons(); render();
const actif=catsEl.querySelector('[aria-pressed="true"]'); if(actif && filter!=='all'){ try{ actif.scrollIntoView({inline:'center',block:'nearest'}); }catch(e){} }

function updateNet(){const on=navigator.onLine;const el=document.getElementById('net');
  el.className='net '+(on?'on':'off'); document.getElementById('netlabel').textContent=on?'En ligne':'Hors-ligne';}
window.addEventListener('online',updateNet); window.addEventListener('offline',updateNet); updateNet();
if('serviceWorker' in navigator){ window.addEventListener('load',()=>{ try{ navigator.serviceWorker.register('sw.js'); }catch(e){} }); }
