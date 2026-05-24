// sw.js - Service Worker pour la Cellule Sakania

// 1. CHANGER LE VERSIONNING ICI À CHAQUE MISE À JOUR
const CACHE_NAME = 'sakania-cache-v1.0.0';

// Liste des fichiers à mettre en cache pour le mode hors-ligne
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './tailwind.config.js',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/lucide@latest'
];

// Installation : Mise en cache des fichiers essentiels
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Mise en cache des ressources globales');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting()) // Force le SW à s'activer immédiatement
  );
});

// Activation : Nettoyage automatique des anciennes versions de cache (Versioning)
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Suppression de l\'ancien cache :', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Stratégie de Cache : Réseau d'abord, sinon Cache (Idéal pour Firebase)
// On tente d'avoir les données fraîches en ligne, sinon on charge le hors-ligne
self.addEventListener('fetch', (e) => {
  // Optionnel : Ignorer les requêtes Firebase Firestore qui gèrent déjà leur propre cache
  if (e.request.url.includes('firestore.googleapis.com')) return;

  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // Si la requête réseau réussit, on met à jour le cache
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Si le réseau échoue (Pas de connexion), on utilise le cache
        return caches.match(e.request);
      })
  );
});
