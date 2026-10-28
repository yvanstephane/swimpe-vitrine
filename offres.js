/* Swimpe — page Emploi/stage/volontariat (volet local), habillage site.
   Lit offres.json, filtre (type / pays multi / domaine), masque les expirées,
   détail avec pièces à cocher. Autonome : ne dépend pas de swimpe.js. */
(function () {
  "use strict";

  var DATA = { maj: "", offres: [] };
  var state = { type: "tout", paysSel: [], domaine: "tout", selection: null, coches: {}, page: 1 };
  var CONTACT_EMAIL = "info.swimpe@gmail.com";
  var PAR_PAGE = 15;

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

  function apresFiltres() {
    return offresVisibles().filter(function (o) {
      if (state.type !== "tout" && o.type !== state.type) return false;
      if (state.paysSel.length > 0 && state.paysSel.indexOf(o.pays) === -1) return false;
      if (state.domaine !== "tout" && o.domaine !== state.domaine) return false;
      return true;
    });
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

  function rendreFiltres() {
    var vis = offresVisibles();
    var zt = $("#of-ftype"); zt.innerHTML = "";
    [["tout", "Tout"], ["emploi", "Emploi"], ["stage", "Stage"], ["volontariat", "Volontariat"], ["concours", "Concours"], ["formation", "Formations"]].forEach(function (t) {
      zt.appendChild(pill(t[1], state.type === t[0], function () { state.type = t[0]; state.page = 1; rendre(); }));
    });
    var zp = $("#of-fpays"); zp.innerHTML = "";
    var lab = el("span", "of-flabel"); lab.textContent = "Pays"; zp.appendChild(lab);
    zp.appendChild(pill("Tous", state.paysSel.length === 0, function () { state.paysSel = []; state.page = 1; rendre(); }));
    uniques(vis, "pays").forEach(function (p) {
      zp.appendChild(pill(p, state.paysSel.indexOf(p) !== -1, function () {
        var i = state.paysSel.indexOf(p); if (i === -1) state.paysSel.push(p); else state.paysSel.splice(i, 1); state.page = 1; rendre();
      }));
    });
    zp.appendChild(selecteur("Domaine", uniques(vis, "domaine"), state.domaine, function (v) { state.domaine = v; state.page = 1; rendre(); }));
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
    var b = el("button", "btn btn-ligne"); b.type = "button"; b.textContent = "Réinitialiser les filtres";
    b.addEventListener("click", function () { state.type = "tout"; state.paysSel = []; state.domaine = "tout"; state.page = 1; rendre(); });
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

  function rendre() {
    var sel = state.selection ? DATA.offres.filter(function (o) { return o.id === state.selection; })[0] : null;
    if (sel && visible(sel)) {
      $("#of-vue-liste").hidden = true; $("#of-vue-detail").hidden = false; rendreDetail(sel);
    } else {
      state.selection = null; $("#of-vue-detail").hidden = true; $("#of-vue-liste").hidden = false;
      rendreFiltres(); rendreListe();
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
