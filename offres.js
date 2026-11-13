/* Swimpe — page Emploi/stage/volontariat (volet local), habillage site.
   Lit offres.json, filtre (type / pays multi / domaine), masque les expirées,
   détail avec pièces à cocher. Autonome : ne dépend pas de swimpe.js. */
(function () {
  "use strict";

  var DATA = { maj: "", offres: [] };
  var state = { type: "tout", pays: "tout", ville: "tout", domaine: "tout", publication: "tout", selection: null, coches: {}, page: 1 };
  var CONTACT_EMAIL = "contact@swimpe.com";
  var PAR_PAGE = 15;

  // Domaines des compétitions (type « concours ») : déduits du texte de l'offre (titre, organisation, domaine).
  // Toutes les familles sont proposées dans le menu « Domaine » ; celles sans offre restent visibles mais non cliquables.
  var DOMC = [
    ["Sport", /sport|football|basket|athl[ée]t|tournoi|championnat|\bcoupe\b/i],
    ["Cinéma & audiovisuel", /cin[ée]ma|\bfilms?\b|m[ée]trage|audiovisuel|documentaire|casting/i],
    ["Musique", /musique|\bchants?\b|chanson/i],
    ["Arts & culture", /\barts?\b|\bmode\b|design|\bphotos?\b|festival|biennale/i],
    ["Écriture & médias", /[ée]criture|litt[ée]ra|journalis|po[ée]sie|\bslam\b/i],
    ["Sciences & maths", /olympiade|\bmaths?\b|math[ée]matique|science|physique|chimie/i],
    ["Informatique & tech", /hackathon|informatique|num[ée]rique|robotique|\btech\b/i],
    ["Entrepreneuriat", /entrepreneur|start-?up|innovation/i],
    ["Écoles & universités (concours d'entrée)", /entr[ée]e|minesup|universit|[ée]cole|institut|facult[ée]|\biut\b|ipes|annale|fastef|\bena\b|\bcycle\b|formation m[ée]dicale|aptitude/i],
    ["Fonction publique & recrutement", /minfopra|fonction publique|administratif|recrutement|police|gendarmerie|douane|arm[ée]e|mairie|nasla|eaux et for[êe]ts|magistrature|s[ée]lection/i]
  ];
  var DOMC_AUTRE = "Autres compétitions";
  function domaineConcours(o) {
    var t = [o.titre, o.organisation, o.domaine].filter(Boolean).join(" ");
    for (var i = 0; i < DOMC.length; i++) if (DOMC[i][1].test(t)) return DOMC[i][0];
    return DOMC_AUTRE;
  }

  function $(s, r) { return (r || document).querySelector(s); }
  function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function esc(s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function todayISO() { return new Date().toISOString().slice(0, 10); }
  function expiree(o) { return o.expire_le && o.expire_le < todayISO(); }
  function visible(o) { return o && o.verifie === true && !expiree(o); }
  function offresVisibles() { return DATA.offres.filter(visible); }
  function uniques(arr, cle) {
    var vus = {}, out = [];
    arr.forEach(function (o) { var v = o[cle]; if (v && !vus[v]) { vus[v] = 1; out.push(v); } });
    out.sort(function (a, b) { return a.localeCompare(b, "fr"); }); return out;
  }
  var LIB = { emploi: "Emploi", stage: "Stage", volontariat: "Volontariat", concours: "Concours", formation: "Formation" };
  function dateFr(iso) {
    if (!iso) return "";
    var m = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    var p = iso.split("-"); if (p.length !== 3) return iso;
    return parseInt(p[2], 10) + " " + (m[parseInt(p[1], 10) - 1] || "");
  }

  // Valeur d'une offre pour chaque famille de filtres (vide -> « Non précisé(e) », comme l'app).
  function valeurDe(cle, o) {
    if (cle === "type") return o.type;
    if (cle === "pays") return o.pays;
    if (cle === "ville") {
      // « Dakar, Senegal » ou « Dakar (+ 1 autre lieu) » -> « Dakar » : un seul choix par ville.
      var v = String(o.ville || "").split(/[,(]/)[0].trim();
      return v || "Non précisée";
    }
    if (cle === "domaine") {
      if (o.type === "concours") return domaineConcours(o);
      return (o.domaine || "").trim() || "Non précisé";
    }
    return "";
  }
  var PUBLICATIONS = [["24h", "Dernières 24 heures", 1], ["7j", "7 derniers jours", 7], ["30j", "30 derniers jours", 30]];
  function joursDepuis(iso) {
    if (!iso) return null;
    var d = Date.parse(String(iso).slice(0, 10)), auj = Date.parse(todayISO());
    return isNaN(d) ? null : Math.round((auj - d) / 86400000);
  }
  function publicationOk(o, id) {
    for (var i = 0; i < PUBLICATIONS.length; i++) if (PUBLICATIONS[i][0] === id) {
      var j = joursDepuis(o.publie_le);
      return j !== null && j >= 0 && j <= PUBLICATIONS[i][2];
    }
    return true;
  }
  function passe(o, sauf) {
    var cles = ["type", "pays", "ville", "domaine"];
    for (var i = 0; i < cles.length; i++) {
      var c = cles[i];
      if (c !== sauf && state[c] !== "tout" && valeurDe(c, o) !== state[c]) return false;
    }
    if (sauf !== "publication" && state.publication !== "tout" && !publicationOk(o, state.publication)) return false;
    return true;
  }
  function apresFiltres() { return offresVisibles().filter(function (o) { return passe(o, null); }); }
  // Compteur d'une option : « comme si on la choisissait », les autres filtres restant appliqués.
  function compte(cle, valeur) {
    return offresVisibles().filter(function (o) {
      if (!passe(o, cle)) return false;
      return cle === "publication" ? publicationOk(o, valeur) : valeurDe(cle, o) === valeur;
    }).length;
  }

  function pill(txt, on, onClick) {
    var b = el("button", "of-pill" + (on ? " on" : "")); b.type = "button";
    b.textContent = txt; b.addEventListener("click", onClick); return b;
  }
  function selecteur(label, vals, cur, onChange) {
    var sel = el("select", "of-select" + (cur !== "tout" ? " on" : ""));
    var o0 = el("option"); o0.value = "tout"; o0.textContent = label; sel.appendChild(o0);
    vals.forEach(function (v) { var op = el("option"); op.value = v; op.textContent = v; if (v === cur) op.selected = true; sel.appendChild(op); });
    sel.addEventListener("change", function () { onChange(sel.value); });
    return sel;
  }

  // Les grandes familles de filtres, chacune en liste déroulante. « Ville » n'apparaît qu'après le choix d'un pays,
  // avec les villes de CE pays. Chaque option affiche son nombre d'offres ; 0 offre = non cliquable.
  function champ(titre, cle, tout, options) {
    var w = el("label", "of-champ");
    var lab = el("span"); lab.textContent = titre; w.appendChild(lab);
    var sel = el("select", "of-select"); sel.id = "of-filtre-" + cle;
    var o0 = el("option"); o0.value = "tout"; o0.textContent = tout; sel.appendChild(o0);
    options.forEach(function (v) {
      var id = v[0], nom = v[1], n = compte(cle, id);
      var op = el("option"); op.value = id; op.textContent = nom + " (" + n + ")";
      if (id === state[cle]) op.selected = true;
      if (n === 0 && id !== state[cle]) op.disabled = true;
      sel.appendChild(op);
    });
    sel.addEventListener("change", function () {
      state[cle] = sel.value;
      if (cle === "pays") state.ville = "tout"; // changer de pays remet la ville à zéro
      if (cle === "type") state.domaine = "tout"; // les domaines dépendent du type
      state.page = 1; rendre();
    });
    w.appendChild(sel);
    return w;
  }
  function rendreFiltres() {
    var vis = offresVisibles();
    var z = $("#of-fmenus"); z.innerHTML = "";
    var paire = function (v) { return [v, v]; };
    z.appendChild(champ("Pays", "pays", "Tous les pays", uniques(vis, "pays").map(paire)));
    if (state.pays !== "tout") {
      var duPays = vis.filter(function (o) { return o.pays === state.pays; });
      var villes = [], vues = {};
      duPays.forEach(function (o) { var v = valeurDe("ville", o); if (!vues[v]) { vues[v] = 1; villes.push(v); } });
      villes.sort(function (a, b) { return a === "Non précisée" ? 1 : b === "Non précisée" ? -1 : a.localeCompare(b, "fr"); });
      z.appendChild(champ("Ville", "ville", "Toutes les villes", villes.map(paire)));
    }
    z.appendChild(champ("Type d’offre", "type",
      "Tous les types", [["emploi", "Emploi"], ["stage", "Stage"], ["volontariat", "Volontariat"], ["concours", "Compétition / concours"], ["formation", "Formations"]]));
    if (state.type === "concours") {
      // Compétitions : toutes les familles (sport inclus) ; 0 offre = visible mais non cliquable.
      var domC = DOMC.map(function (d) { return d[0]; }); domC.push(DOMC_AUTRE);
      z.appendChild(champ("Domaine", "domaine", "Tous les domaines", domC.map(paire)));
    } else {
      var domaines = [], vusD = {};
      vis.forEach(function (o) { var v = valeurDe("domaine", o); if (!vusD[v]) { vusD[v] = 1; domaines.push(v); } });
      domaines.sort(function (a, b) { return a === "Non précisé" ? 1 : b === "Non précisé" ? -1 : a.localeCompare(b, "fr"); });
      z.appendChild(champ("Domaine", "domaine", "Tous les domaines", domaines.map(paire)));
    }
    z.appendChild(champ("Date de publication", "publication", "Toutes les dates",
      PUBLICATIONS.map(function (p) { return [p[0], p[1]]; })));
  }

  function badge(type) { var b = el("span", "of-badge " + esc(type)); b.textContent = LIB[type] || type; return b; }

  function rendreListe() {
    var liste = $("#of-liste"); liste.innerHTML = "";
    var res = apresFiltres();
    $("#of-compteur").innerHTML = '<span class="pt"></span>' + res.length + (res.length > 1 ? " offres" : " offre") + " · vérifiées le " + dateFr(DATA.maj);
    if (res.length === 0) { liste.appendChild(vide(offresVisibles().length === 0)); return; }
    var pages = Math.max(1, Math.ceil(res.length / PAR_PAGE));
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
    var debut = (state.page - 1) * PAR_PAGE;
    res.slice(debut, debut + PAR_PAGE).forEach(function (o) { liste.appendChild(carte(o)); });
    if (pages > 1) liste.appendChild(pagination(pages, res.length, debut, res.slice(debut, debut + PAR_PAGE).length));
  }

  function aller(p) {
    state.page = p; rendre();
    var t = document.getElementById("of-vue-liste");
    window.scrollTo(0, t ? Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - 10) : 0);
  }

  function pagination(pages, total, debut, nb) {
    var wrap = el("nav", "of-pagination"); wrap.setAttribute("aria-label", "Pagination");
    var info = el("span", "of-pg-info");
    info.textContent = "Offres " + (debut + 1) + "–" + (debut + nb) + " sur " + total;
    wrap.appendChild(info);
    var barre = el("div", "of-pg-barre");
    function bouton(txt, p, actif, courant) {
      var b = el("button", "of-pg" + (courant ? " on" : ""));
      b.type = "button"; b.innerHTML = txt;
      if (!actif) { b.disabled = true; }
      else { b.addEventListener("click", function () { aller(p); }); }
      return b;
    }
    barre.appendChild(bouton("&larr;", state.page - 1, state.page > 1, false));
    // numéros fenêtrés : 1 … (p-1) p (p+1) … N
    var nums = [];
    for (var i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= state.page - 1 && i <= state.page + 1)) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    nums.forEach(function (n) {
      if (n === "…") { var s = el("span", "of-pg-ell"); s.textContent = "…"; barre.appendChild(s); }
      else barre.appendChild(bouton(String(n), n, true, n === state.page));
    });
    barre.appendChild(bouton("&rarr;", state.page + 1, state.page < pages, false));
    wrap.appendChild(barre);
    return wrap;
  }

  function carte(o) {
    var c = el("article", "of-carte"); c.tabIndex = 0; c.setAttribute("role", "button");
    var haut = el("div", "of-haut");
    var bs = el("div", "of-badges"); bs.appendChild(badge(o.type));
    var v = el("span", "of-verif"); v.innerHTML = "&#10003; Vérifié"; bs.appendChild(v);
    haut.appendChild(bs);
    if (o.expire_le) { var e = el("span", "of-expire"); e.textContent = "Expire le " + dateFr(o.expire_le); haut.appendChild(e); }
    c.appendChild(haut);
    var t = el("h3", "of-titre"); t.textContent = o.titre; c.appendChild(t);
    var m = el("p", "of-meta"); m.textContent = [o.organisation, o.ville ? o.ville + ", " + o.pays : o.pays, o.domaine].filter(Boolean).join(" · "); c.appendChild(m);
    var lblCarte = o.type === "concours" ? "Voir le concours" : (o.type === "formation" ? "Voir la formation" : (o.type === "volontariat" ? "Voir / s'engager" : "Voir / postuler"));
    var voir = el("div", "of-voir"); voir.innerHTML = lblCarte + " &rarr;"; c.appendChild(voir);
    function ouvrir() { state.selection = o.id; rendre(); window.scrollTo(0, 0); }
    c.addEventListener("click", ouvrir);
    c.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); ouvrir(); } });
    return c;
  }

  function vide(datasetVide) {
    var d = el("div", "of-vide");
    if (datasetVide) {
      var ht = el("h3"); ht.textContent = "Les premières offres arrivent très bientôt"; d.appendChild(ht);
      var hp = el("p"); hp.textContent = "Swimpe publie uniquement des offres vérifiées : emploi, stage, volontariat, concours et formations. Reviens très vite."; d.appendChild(hp);
      return d;
    }
    var h = el("h3"); h.textContent = "Aucune offre pour ces filtres"; d.appendChild(h);
    var p = el("p"); p.textContent = "Élargis ta recherche — de nouvelles offres vérifiées sont ajoutées régulièrement."; d.appendChild(p);
    if (state.type === "volontariat") {
      // Pas d'offre de volontariat pour l'instant : on guide vers les programmes + tutoriels.
      var pv = el("p");
      pv.innerHTML = 'En attendant, découvre les <a href="programmes.html" style="color:var(--sceau);font-weight:700">programmes de volontariat et leurs tutoriels pas à pas &rarr;</a>';
      d.appendChild(pv);
    }
    var b = el("button", "btn btn-ligne"); b.type = "button"; b.textContent = "Réinitialiser les filtres";
    b.addEventListener("click", function () { state.type = "tout"; state.pays = "tout"; state.ville = "tout"; state.domaine = "tout"; state.publication = "tout"; state.page = 1; rendre(); });
    d.appendChild(b); return d;
  }

  function tag(txt) { var s = el("span", "of-tag"); s.textContent = txt; return s; }

  function rendreDetail(o) {
    var d = $("#of-detail"); d.innerHTML = "";
    var r = el("button", "of-retour"); r.type = "button"; r.innerHTML = "&larr; Toutes les offres";
    r.addEventListener("click", function () { state.selection = null; rendre(); window.scrollTo(0, 0); });
    d.appendChild(r);
    var bs = el("div", "of-badges"); bs.appendChild(badge(o.type));
    var v = el("span", "of-verif"); v.innerHTML = "&#10003; Vérifié" + (o.methode_verif === "auto" ? " · source officielle" : ""); bs.appendChild(v);
    d.appendChild(bs);
    var t = el("h1", "of-dtitre"); t.textContent = o.titre; d.appendChild(t);
    var m = el("p", "of-meta"); m.textContent = [o.organisation, o.ville ? o.ville + ", " + o.pays : o.pays].filter(Boolean).join(" · "); d.appendChild(m);
    var tags = el("div", "of-tags");
    if (o.domaine) tags.appendChild(tag(o.domaine));
    if (o.publie_le) tags.appendChild(tag("Publié le " + dateFr(o.publie_le)));
    if (o.expire_le) tags.appendChild(tag("Expire le " + dateFr(o.expire_le)));
    d.appendChild(tags);
    var desc = el("p", "of-desc"); desc.textContent = o.description; d.appendChild(desc);
    if (Array.isArray(o.pieces_a_fournir) && o.pieces_a_fournir.length) d.appendChild(blocPieces(o));
    var al = el("div", "of-alerte");
    var txtAlerte = o.type === "concours"
      ? "Concours officiel. Seuls les frais indiqués sur l'avis officiel, payés au Trésor public, sont légitimes. Ne verse jamais d'argent à un intermédiaire qui « garantit » une place."
      : (o.type === "formation"
        ? "Formation / programme officiel. Vérifie les conditions et la date limite sur le site officiel. Méfie-toi de tout intermédiaire qui facture l'accès ou « garantit » une place."
        : "Offre vérifiée par Swimpe. Ne paie jamais pour postuler : aucun emploi, stage ou volontariat légitime ne se paie.");
    al.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/></svg>' +
      '<span>' + txtAlerte + '</span>';
    d.appendChild(al);
    var cp = o.comment_postuler || {};
    var href = cp.mode === "email" ? "mailto:" + encodeURIComponent(cp.valeur) : cp.valeur;
    var a = el("a", "btn btn-plein"); a.href = href || "#";
    if (cp.mode !== "email") { a.target = "_blank"; a.rel = "noopener noreferrer"; }
    var lblBtn = o.type === "concours" ? "Voir l'avis officiel" : (o.type === "formation" ? "S'inscrire sur le site officiel" : (cp.mode === "email" ? "Postuler par e-mail" : "Postuler sur le site officiel"));
    a.innerHTML = lblBtn + " &#8599;";
    d.appendChild(a);
    var sig = el("a", "of-signaler"); sig.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent("Signalement offre " + o.id);
    sig.innerHTML = "&#9873; Signaler cette offre"; d.appendChild(sig);
  }

  function blocPieces(o) {
    if (!state.coches[o.id]) state.coches[o.id] = {};
    var coches = state.coches[o.id];
    var prep = el("div", "of-prep");
    var h = el("h4"); h.textContent = "Ton dossier — coche ce que tu as prêt"; prep.appendChild(h);
    var cpt = el("p", "cpt"); prep.appendChild(cpt);
    function maj() {
      var tot = o.pieces_a_fournir.length, f = 0;
      o.pieces_a_fournir.forEach(function (_, i) { if (coches[i]) f++; });
      cpt.textContent = f + " / " + tot + " prêt" + (f > 1 ? "s" : ""); cpt.className = "cpt" + (f === tot ? " ok" : "");
    }
    o.pieces_a_fournir.forEach(function (piece, i) {
      var row = el("label", "of-piece" + (coches[i] ? " ok" : ""));
      var cb = el("input"); cb.type = "checkbox"; cb.checked = !!coches[i];
      cb.addEventListener("change", function () { coches[i] = cb.checked; row.className = "of-piece" + (cb.checked ? " ok" : ""); maj(); });
      var s = el("span"); s.textContent = piece; row.appendChild(cb); row.appendChild(s); prep.appendChild(row);
    });
    var note = el("p", "note"); note.textContent = "Swimpe ne collecte aucun document : tu les transmets directement à l'organisation."; prep.appendChild(note);
    maj(); return prep;
  }

  function pastille(txt, cle) {
    var b = el("button", "of-pill on"); b.type = "button";
    b.innerHTML = esc(txt) + " \u2715";
    b.setAttribute("aria-label", "Retirer le filtre " + txt);
    b.addEventListener("click", function () {
      state[cle] = "tout";
      if (cle === "pays") state.ville = "tout";
      if (cle === "type") state.domaine = "tout";
      state.page = 1; rendre();
    });
    return b;
  }
  // Barre qui reste visible en défilant : les choix en cours (retirables), le nombre d'offres, et « Filtres »
  // pour remonter aux menus d'un geste.
  function rendreColle() {
    var z = $("#of-colle"); if (!z) return;
    z.innerHTML = "";
    var b = el("button", "of-colle-btn"); b.type = "button"; b.textContent = "\u2630 Filtres";
    b.addEventListener("click", function () {
      var t = $("#of-fmenus");
      if (t) window.scrollTo({ top: Math.max(0, t.getBoundingClientRect().top + window.pageYOffset - 70), behavior: "smooth" });
    });
    z.appendChild(b);
    var TYPES_LIB = { emploi: "Emploi", stage: "Stage", volontariat: "Volontariat", concours: "Comp\u00e9tition / concours", formation: "Formations" };
    if (state.type !== "tout") z.appendChild(pastille(TYPES_LIB[state.type] || state.type, "type"));
    if (state.pays !== "tout") z.appendChild(pastille(state.pays, "pays"));
    if (state.ville !== "tout") z.appendChild(pastille(state.ville, "ville"));
    if (state.domaine !== "tout") z.appendChild(pastille(state.domaine, "domaine"));
    if (state.publication !== "tout") {
      PUBLICATIONS.forEach(function (p) { if (p[0] === state.publication) z.appendChild(pastille(p[1], "publication")); });
    }
    var n = apresFiltres().length;
    var c = el("span", "of-colle-nb"); c.textContent = n + (n > 1 ? " offres" : " offre"); z.appendChild(c);
  }

  function rendre() {
    var sel = state.selection ? DATA.offres.filter(function (o) { return o.id === state.selection; })[0] : null;
    if (sel && visible(sel)) {
      $("#of-vue-liste").hidden = true; $("#of-vue-detail").hidden = false; rendreDetail(sel);
    } else {
      state.selection = null; $("#of-vue-detail").hidden = true; $("#of-vue-liste").hidden = false;
      rendreFiltres(); rendreColle(); rendreListe();
    }
  }

  function brancherMenu() {
    var b = $("#btn-menu");
    if (b) b.addEventListener("click", function () {
      var m = $("#menu"); if (!m) return; var o = m.classList.toggle("open"); this.setAttribute("aria-expanded", o);
    });
  }

  function init() {
    brancherMenu();
    fetch("offres.json?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function (d) {
        DATA.maj = d.maj || ""; DATA.offres = Array.isArray(d.offres) ? d.offres : [];
        var mj = $("#of-maj"); if (mj) mj.textContent = dateFr(DATA.maj);
        rendre();
      })
      .catch(function (e) {
        $("#of-liste").innerHTML = '<div class="of-vide"><h3>Chargement impossible</h3><p>Réessaie dans un instant. (' + esc(e.message) + ')</p></div>';
      });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();
