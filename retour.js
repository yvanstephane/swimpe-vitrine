// Boutons « ← Retour » (liens portant data-retour) : si l'on vient d'une autre page du site Swimpe ou de l'application,
// on revient exactement à cette page ; sinon (page ouverte directement) le lien normal mène à l'accueil.
// Fichier externe : la politique de sécurité du site interdit les scripts écrits dans la page.
(function () {
  document.addEventListener('click', function (e) {
    var lien = e.target.closest && e.target.closest('[data-retour]');
    if (!lien) return;
    try {
      if (document.referrer && history.length > 1) {
        var h = new URL(document.referrer).hostname;
        if (h === location.hostname || /(^|\.)swimpe\.com$/.test(h)) { e.preventDefault(); history.back(); }
      }
    } catch (err) { /* on suit le lien normal */ }
  });
})();
