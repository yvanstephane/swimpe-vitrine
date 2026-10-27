// « Vérifier un site » (page Anti-arnaque) : on colle un lien, une adresse e-mail ou un nom d'organisme, et on voit :
//   • si c'est l'adresse OFFICIELLE d'un organisme de notre liste (annuaire/donnees.js) ;
//   • si elle RESSEMBLE à l'une d'elles sans être la même (faute, autre extension, nom collé à d'autres mots…) ;
//   • ou si elle n'est pas dans la liste (ce qui ne veut PAS dire que c'est une arnaque, ni que c'est sûr).
// Tout se passe dans le navigateur : rien de ce qui est collé n'est envoyé (la politique de sécurité du site l'interdit).
// Dépend de donnees.js (D, CATS, SHORT), chargé avant ce fichier.
(function () {
  'use strict';
  if (typeof D === 'undefined') return;
  var form = document.getElementById('vf-form'), champ = document.getElementById('vf-champ'), sortie = document.getElementById('vf-sortie');
  if (!form || !champ || !sortie) return;

  var DOM_OK = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i;          // un domaine, sans chemin
  var SLD = { co: 1, com: 1, org: 1, gov: 1, gouv: 1, ac: 1, edu: 1, net: 1, or: 1, go: 1, ne: 1 };
  // Domaines où n'importe qui peut ouvrir une page : « même domaine principal » n'y prouve rien.
  var PARTAGES = { 'google.com': 1, 'facebook.com': 1, 'linkedin.com': 1, 'myworkdayjobs.com': 1, 'blogspot.com': 1, 'wordpress.com': 1,
    'wixsite.com': 1, 'github.io': 1, 'weebly.com': 1, 'forms.gle': 1, 'wa.me': 1, 't.me': 1 };
  // Sites où n'importe qui peut créer gratuitement une page ou un formulaire (très utilisés par les faux recrutements).
  var OUVERTS = ['docs.google.com', 'forms.gle', 'sites.google.com', 'drive.google.com', 'facebook.com', 'instagram.com', 'tiktok.com', 'blogspot.com',
    'wordpress.com', 'wixsite.com', 'weebly.com', 'github.io', 'notion.site', 'carrd.co', 'godaddysites.com', 'webflow.io', 'jimdofree.com', 'typeform.com', 'jotform.com'];
  var RACCOURCIS = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'is.gd', 'ow.ly', 'buff.ly', 'cutt.ly', 'rb.gy', 'shorturl.at', 'tiny.cc', 'wa.me',
    'api.whatsapp.com', 'chat.whatsapp.com', 'whatsapp.com', 't.me', 'telegram.me', 'linktr.ee', 'forms.gle', 'lnkd.in', 'fb.me', 'm.me'];
  // Messageries gratuites « grand public » (on ne compte pas orange/free/sfr, qui sont aussi des opérateurs réels).
  var MESSAGERIE_SURE = /^(gmail|googlemail|yahoo|ymail|rocketmail|hotmail|outlook|live|msn|icloud|aol|gmx|mail|yandex|protonmail|proton|zoho|tutanota|inbox)\.[a-z.]+$/i;

  function esc(t) { return String(t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function sansAccents(t) { return String(t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
  function base(h) {
    var p = h.split('.'), n = p.length;
    if (n <= 2) return h;
    if (p[n - 1].length === 2 && SLD[p[n - 2]]) return p.slice(-3).join('.');
    return p.slice(-2).join('.');
  }
  function etiquette(b) { return b.split('.')[0]; }
  function extension(b) { var p = b.split('.'); return '.' + p.slice(1).join('.'); }
  function homo(s) { return s.replace(/rn/g, 'm').replace(/vv/g, 'w').replace(/0/g, 'o').replace(/1/g, 'l').replace(/3/g, 'e').replace(/5/g, 's'); }
  function dist(a, b) {
    var i, j, m = a.length, n = b.length, prev = [], cur;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur = [i];
      for (j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1));
      prev = cur;
    }
    return prev[n];
  }

  // La liste des sites connus (les domaines précis ; une fiche « facebook.com/business/learn » avec chemin n'en fait pas partie).
  var LISTE = [];
  D.forEach(function (r) {
    var d = String(r[2] || '').toLowerCase().replace(/^www\./, '');
    if (DOM_OK.test(d)) LISTE.push({ d: d, b: base(d), l: etiquette(base(d)), r: r });
  });
  var RANG = { officiel: 0, interm: 1, averifier: 2, risque: 3 };
  // Plusieurs fiches peuvent partager un domaine (ex. unicef.org) : on montre d'abord la plus fiable, puis celle de la catégorie
  // la plus « générale » (ONU, ONG, public… avant sport, arts, plateformes), dans l'ordre de ORDER.
  function meilleur(x, y) {
    var a = RANG[x.r[4]] || 0, b = RANG[y.r[4]] || 0;
    if (a !== b) return a < b ? x : y;
    return ORDER.indexOf(x.r[0]) <= ORDER.indexOf(y.r[0]) ? x : y;
  }

  // ---- Lire ce que la personne a collé ----
  function lire(brut) {
    var s = brut.trim();
    if (!s) return { type: 'vide' };
    s = s.replace(/^mailto:/i, '');
    var m = s.match(/^[^\s@\/:]+@([^\s@\/:]+\.[a-z0-9-]{2,})$/i);
    if (m) return { type: 'email', hote: m[1].toLowerCase().replace(/\.$/, ''), brut: s };
    if (/^(javascript|data|file|vbscript|blob):/i.test(s)) return { type: 'invalide' };
    var url = null;
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s)) url = s;
    else if (!/\s/.test(s) && /^[^\s\/?#@]+\.[a-z]{2,}([\/?#:].*)?$/i.test(s)) url = 'https://' + s;
    if (!url) return { type: 'nom', texte: s };
    try {
      var u = new URL(url);
      if (!/^https?:$/.test(u.protocol)) return { type: 'invalide' };
      var hote = u.hostname.toLowerCase().replace(/\.$/, '').replace(/^www\./, '');
      if (!hote) return { type: 'invalide' };
      return { type: 'url', hote: hote, brut: s, arobase: /^[a-z]+:\/\/[^\/?#]*@/i.test(url) };
    } catch (e) { return { type: 'invalide' }; }
  }

  // ---- Signaux d'alerte, quelle que soit la liste ----
  function signaux(lu) {
    var out = [], h = lu.hote || '';
    if (lu.type === 'url' || lu.type === 'email') {
      if (RACCOURCIS.indexOf(h) >= 0 || RACCOURCIS.indexOf(base(h)) >= 0) out.push('Lien raccourci ou messagerie (' + esc(h) + ') : l\'adresse du vrai site est cachée. Demande le lien complet, ou cherche l\'offre toi-même sur le site de l\'organisme.');
      if (h.indexOf('xn--') >= 0) out.push('Cette adresse utilise des caractères spéciaux qui peuvent imiter des lettres : méfie-toi.');
      if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) out.push('Adresse faite de chiffres : ce n\'est jamais le site d\'un organisme officiel.');
      if (lu.arobase) out.push('Le lien contient un « @ » : tout ce qui est avant le « @ » est un leurre, le vrai site est ce qui suit.');
    }
    if (lu.type === 'url' && OUVERTS.some(function (o) { return h === o || h.slice(-(o.length + 1)) === '.' + o; })) out.push('Sur ce type de site (réseau social, formulaire ou page gratuite), n\'importe qui peut créer une page ou un formulaire en quelques minutes. Un vrai recrutement passe par le site de l\'organisme : une demande de documents ou d\'argent via un formulaire ou un profil, c\'est un signal d\'alerte.');
    if (lu.type === 'email' && MESSAGERIE_SURE.test(h)) out.push('C\'est une adresse e-mail gratuite (Gmail, Yahoo, Hotmail…). Un organisme officiel écrit depuis l\'adresse de son propre site : c\'est un signal d\'alerte fort pour un recrutement.');
    return out;
  }

  // ---- Chercher dans la liste ----
  function trouver(hote) {
    var exact = [], pareil = [], hb = base(hote);
    LISTE.forEach(function (x) {
      if (hote === x.d || hote.slice(-(x.d.length + 1)) === '.' + x.d) exact.push(x);
      else if (!PARTAGES[x.b] && x.b === hb) pareil.push(x);
    });
    if (exact.length) {
      var plusLong = Math.max.apply(null, exact.map(function (x) { return x.d.length; }));
      exact = exact.filter(function (x) { return x.d.length === plusLong; });
      return { genre: 'exact', fiches: exact };
    }
    if (pareil.length) return { genre: 'pareil', fiches: pareil };
    return null;
  }
  function ressemblances(hote) {
    var b = base(hote), l = etiquette(b), vus = {}, res = [];
    LISTE.forEach(function (x) {
      if (x.l.length < 4) return;
      if (hote === x.d || hote.slice(-(x.d.length + 1)) === '.' + x.d) return;
      var raison = null, jetons = l.split('-');
      if (l === x.l && b !== x.b) raison = 'même nom mais autre extension (' + extension(b) + ' au lieu de ' + extension(x.b) + ')';
      else if (l !== x.l && homo(l) === homo(x.l)) raison = 'lettres qui en imitent d\'autres';
      else if (l !== x.l && Math.abs(l.length - x.l.length) <= 2 && x.l.length >= 5 && dist(l, x.l) <= (x.l.length >= 8 ? 2 : 1)) raison = 'orthographe presque identique';
      else if (l !== x.l && (jetons.indexOf(x.l) >= 0 || (x.l.length >= 5 && l.indexOf(x.l) >= 0))) raison = 'le nom de l\'organisme est collé à d\'autres mots';
      else if (x.d.length >= 6 && hote.indexOf(x.d) >= 0) raison = 'l\'adresse officielle apparaît dans une adresse qui mène ailleurs';
      if (!raison) return;
      var cle = x.l;
      if (vus[cle]) { vus[cle].x = meilleur(vus[cle].x, x); return; }
      vus[cle] = { x: x, raison: raison }; res.push(vus[cle]);
    });
    return res.slice(0, 2);
  }
  function chercherNom(q) {
    var mots = sansAccents(q).split(/\s+/).filter(function (m) { return m.length > 1 || /\d/.test(m); });
    if (!mots.length) return [];
    var trouves = D.filter(function (r) {
      var foin = sansAccents(r[1] + ' ' + r[2] + ' ' + r[3] + ' ' + r[5]);
      return mots.every(function (m) { return foin.indexOf(m) >= 0; });
    });
    trouves.sort(function (a, b) {
      var an = sansAccents(a[1]), bn = sansAccents(b[1]), k = mots[0];
      return ((an.indexOf(k) >= 0 ? 0 : 1) - (bn.indexOf(k) >= 0 ? 0 : 1)) || ((RANG[a[4]] || 0) - (RANG[b[4]] || 0));
    });
    return trouves.slice(0, 6);
  }

  // ---- Affichage ----
  var STATUT = {
    officiel: { cls: 'ok', titre: '✅ Adresse officielle connue' },
    averifier: { cls: 'att', titre: '🟡 Dans notre liste, pas encore confirmé' },
    interm: { cls: 'att', titre: 'ℹ️ Intermédiaire (cabinet ou agence)' },
    risque: { cls: 'alerte', titre: '⚠️ Dans notre liste avec la mention « Risqué »' }
  };
  function lienOuvrir(domaine, r, libelle) {
    if (r && r[4] === 'risque') return '';
    return '<a class="vf-lien" href="https://' + esc(domaine) + '" target="_blank" rel="noopener noreferrer">' + (libelle || 'Ouvrir le site officiel') + ' ↗</a>';
  }
  function categorie(r) { return esc((typeof SHORT !== 'undefined' && SHORT[r[0]]) || r[0]); }
  function blocFiche(x, hoteSaisi, genre, fiches) {
    var r = x.r, st = STATUT[r[4]] || STATUT.officiel, titre = st.titre, cls = st.cls, txt;
    if (genre === 'pareil') {
      titre = '🟡 Même site principal, autre adresse'; cls = 'att';
      txt = 'Le domaine principal (<b>' + esc(x.b) + '</b>) est celui de <b>' + esc(r[1]) + '</b>, mais l\'adresse exacte que tu as collée (' + esc(hoteSaisi) + ') n\'est pas celle que nous avons notée (<b>' + esc(x.d) + '</b>). Vérifie qu\'on y arrive bien depuis le site officiel.';
    } else if (r[4] === 'officiel') {
      txt = r[0] === 'plateforme'
        ? 'C\'est bien l\'adresse de cette plateforme d\'annonces. Mais n\'importe qui peut y publier : vérifie l\'annonce elle-même, et ne paie jamais pour postuler.'
        : 'C\'est bien l\'adresse du site de cet organisme. Une vraie offre se trouve sur ce site — et ne se paie jamais.';
    } else if (r[4] === 'averifier') {
      txt = 'Nous avons noté cette adresse, mais elle n\'est pas encore confirmée. Vérifie-la sur un autre site officiel avant de donner quoi que ce soit.';
    } else if (r[4] === 'interm') {
      txt = 'Ce n\'est pas l\'employeur lui-même. Un vrai cabinet de recrutement ne fait jamais payer le candidat.';
    } else {
      txt = 'Les offres qui passent par ce site demandent plus de prudence. Lis la note ci-dessous.';
    }
    var autres = (fiches || []).filter(function (f) { return f !== x; }).map(function (f) { return f.r[1]; });
    return '<div class="vf-res vf-' + cls + '"><p class="vf-titre">' + titre + '</p>' +
      '<p class="vf-ligne"><b>' + esc(r[1]) + '</b> · <span class="vf-dom">' + esc(x.d) + '</span> · ' + categorie(r) + '</p>' +
      '<p class="vf-txt">' + txt + '</p>' + (r[5] ? '<p class="vf-note">' + esc(r[5]) + '</p>' : '') +
      (autres.length ? '<p class="vf-note">Cette adresse sert aussi pour : ' + esc(autres.slice(0, 4).join(' · ')) + (autres.length > 4 ? '…' : '') + '</p>' : '') +
      lienOuvrir(x.d, r) + '</div>';
  }
  function blocRessemble(item, hoteSaisi) {
    var x = item.x;
    return '<div class="vf-res vf-alerte"><p class="vf-titre">⚠️ Attention : ressemble à un site officiel</p>' +
      '<p class="vf-txt">L\'adresse <b>' + esc(hoteSaisi) + '</b> ressemble à celle de <b>' + esc(x.r[1]) + '</b> (<b>' + esc(x.d) + '</b>) — ' + esc(item.raison) + ' — mais ce n\'est <b>pas la même</b>. Les faux sites copient les noms des vrais : tape toi-même l\'adresse officielle plutôt que de suivre ce lien.</p>' +
      lienOuvrir(x.d, x.r, 'Ouvrir le vrai site (' + esc(x.d) + ')') + '</div>';
  }
  var CONSEILS = '<p class="vf-txt">À faire avant de donner quoi que ce soit :</p><ol class="vf-liste">' +
    '<li>Cherche toi-même le nom de l\'organisme (pas le lien reçu) et compare l\'adresse du site.</li>' +
    '<li>Retrouve l\'offre sur son site officiel. Si elle n\'y est pas, n\'y va pas.</li>' +
    '<li>Ne paie rien. N\'envoie ni mot de passe ni pièce d\'identité avant d\'être sûr·e.</li>' +
    '<li>Un doute ? Envoie-nous le lien : <a href="mailto:alerte@swimpe.com?subject=Signalement%20d\'un%20site%20suspect">alerte@swimpe.com</a></li></ol>';
  function blocInconnu(saisie) {
    return '<div class="vf-res vf-info"><p class="vf-titre">ℹ️ Pas dans notre liste</p>' +
      '<p class="vf-txt"><b>' + esc(saisie) + '</b> n\'est pas dans notre liste de sites officiels. Notre liste ne couvre pas tout : ça ne veut pas dire que c\'est une arnaque — mais ça ne veut pas dire que c\'est sûr non plus.</p>' + CONSEILS + '</div>';
  }
  function blocSignaux(liste) {
    if (!liste.length) return '';
    return '<div class="vf-res vf-alerte"><p class="vf-titre">⚠️ Signal d\'alerte</p><ul class="vf-liste">' + liste.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul></div>';
  }
  function blocNoms(q, rows) {
    if (!rows.length) {
      return '<div class="vf-res vf-info"><p class="vf-titre">ℹ️ Aucun organisme de ce nom dans la liste</p><p class="vf-txt">Essaie avec un autre mot, ou colle directement le lien reçu. ' +
        'Notre liste ne couvre pas tout.</p>' + CONSEILS + '</div>';
    }
    return '<div class="vf-res vf-ok"><p class="vf-titre">🔎 ' + rows.length + ' organisme' + (rows.length > 1 ? 's' : '') + ' dans notre liste</p>' +
      rows.map(function (r) {
        var st = STATUT[r[4]] || STATUT.officiel, pastille = r[4] === 'officiel' ? 'Officiel' : r[4] === 'averifier' ? 'À vérifier' : r[4] === 'risque' ? 'Risqué' : 'Intermédiaire';
        var dom = DOM_OK.test(String(r[2]).toLowerCase()) ? String(r[2]).toLowerCase() : null;
        return '<div class="vf-nom"><p class="vf-ligne"><b>' + esc(r[1]) + '</b> <span class="vf-pastille vf-p-' + st.cls + '">' + pastille + '</span></p>' +
          '<p class="vf-note">' + esc(r[3]) + ' — ' + esc(r[5]) + '</p>' +
          (dom ? '<p class="vf-ligne"><span class="vf-dom">' + esc(dom) + '</span> ' + lienOuvrir(dom, r, 'Ouvrir') + '</p>' : '<p class="vf-note">Adresse : ' + esc(r[2]) + '</p>') + '</div>';
      }).join('') +
      '<p class="vf-txt">Le lien « Ouvrir » mène à l\'adresse que nous avons notée. Compare-la toujours avec celle qu\'on t\'a donnée.</p></div>';
  }

  function verifier() {
    var lu = lire(champ.value), html = '';
    if (lu.type === 'vide') { sortie.innerHTML = ''; return; }
    if (lu.type === 'invalide') {
      sortie.innerHTML = '<div class="vf-res vf-info"><p class="vf-titre">ℹ️ Ce n\'est pas une adresse de site</p><p class="vf-txt">Colle un lien (https://…), une adresse e-mail ou le nom de l\'organisme.</p></div>';
      return;
    }
    if (lu.type === 'nom') { sortie.innerHTML = blocNoms(lu.texte, chercherNom(lu.texte)); return; }
    var alertes = blocSignaux(signaux(lu)), trouve = trouver(lu.hote), sim = trouve ? [] : ressemblances(lu.hote);
    if (lu.type === 'email') {
      var intro = '<p class="vf-adresse">Adresse e-mail : <b>' + esc(lu.brut) + '</b> — domaine : <b>' + esc(lu.hote) + '</b></p>';
      if (trouve && trouve.genre === 'exact') {
        html = intro + blocFiche(trouve.fiches.reduce(meilleur), lu.hote, 'exact', trouve.fiches) +
          '<div class="vf-res vf-att"><p class="vf-titre">🟡 Le domaine est bon, mais cela ne prouve pas l\'expéditeur</p><p class="vf-txt">N\'importe qui peut écrire un faux e-mail qui semble venir d\'un vrai domaine. Ne clique pas sur les liens du message : va sur le site officiel et cherche l\'offre toi-même. Et rien ne se paie.</p></div>';
      } else {
        html = intro + sim.map(function (i) { return blocRessemble(i, lu.hote); }).join('') + (MESSAGERIE_SURE.test(lu.hote) ? '' : blocInconnu(lu.hote));
      }
      sortie.innerHTML = alertes + html; return;
    }
    if (trouve) html = blocFiche(trouve.fiches.reduce(meilleur), lu.hote, trouve.genre, trouve.fiches);
    else html = sim.map(function (i) { return blocRessemble(i, lu.hote); }).join('') + blocInconnu(lu.hote);
    sortie.innerHTML = alertes + '<p class="vf-adresse">Site vérifié : <b>' + esc(lu.hote) + '</b></p>' + html;
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); verifier(); });
  champ.addEventListener('paste', function () { setTimeout(verifier, 0); });
  champ.addEventListener('input', function () { if (!champ.value.trim()) sortie.innerHTML = ''; });
  document.querySelectorAll('[data-vf-exemple]').forEach(function (b) {
    b.addEventListener('click', function () { champ.value = b.getAttribute('data-vf-exemple'); verifier(); champ.focus(); });
  });
})();
