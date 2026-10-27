// Menu « ≡ » des pages sur téléphone (fichier à part : la politique de sécurité du site interdit les scripts écrits dans la page).
(function(){
  var b=document.getElementById('btn-menu'),m=document.getElementById('menu');
  if(b&&m){b.addEventListener('click',function(){var o=m.classList.toggle('open');b.setAttribute('aria-expanded',o?'true':'false');});}
})();
