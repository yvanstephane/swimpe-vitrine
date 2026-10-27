// Service worker des Sources officielles Swimpe (page /annuaire/) — RÉSEAU D'ABORD, copie gardée si pas de réseau (ou réseau trop lent).
//
// Avant (v2) : « cache d'abord » avec une version de cache qui ne changeait jamais. Résultat : un téléphone ou un
// navigateur qui avait déjà ouvert l'annuaire gardait l'ancienne liste pour toujours, même après l'ajout de nouvelles
// fiches (sport, etc.). Maintenant : quand il y a du réseau, on charge toujours la dernière version, et on s'en sert
// pour mettre à jour la copie hors connexion.
const CACHE = 'swimpe-offline-v3'; // changer ce nom purge les anciennes copies chez tout le monde
const ASSETS = ['./', './index.html', './app.js', './manifest.webmanifest', './icon.svg'];
const DELAI_RESEAU_MS = 4000; // au-delà, sur une connexion très lente, on montre la copie gardée

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // cache: 'reload' = on va chercher la vraie dernière version (pas la copie du navigateur)
      .then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function depuisLeReseau(req) {
  return fetch(req).then((resp) => {
    // On ne garde que les réponses réussies (jamais une page d'erreur).
    if (resp && resp.ok) {
      const copie = resp.clone();
      caches.open(CACHE).then((c) => c.put(req, copie)).catch(() => {});
    }
    return resp;
  });
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  e.respondWith((async () => {
    const reseau = depuisLeReseau(req);
    e.waitUntil(reseau.catch(() => {})); // laisse la mise à jour de la copie se terminer même si on a répondu avant
    try {
      return await Promise.race([
        reseau,
        new Promise((_, refus) => setTimeout(() => refus(new Error('reseau lent')), DELAI_RESEAU_MS))
      ]);
    } catch (err) {
      const gardee = await caches.match(req);
      if (gardee) return gardee;
      try { return await reseau; } catch (err2) { /* pas de réseau et rien de gardé */ }
      return (await caches.match('./index.html')) || Response.error();
    }
  })());
});
