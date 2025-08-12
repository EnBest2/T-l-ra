const CACHE_NAME = 'salary-calculator-v1';
const urlsToCache = [
    '/',
    'index.html',
    'style.css',
    'script.js',
    'manifest.json',
    'ikonok/app_icon_48x48.png',
    'ikonok/app_icon_72x72.png',
    'ikonok/app_icon_96x96.png',
    'ikonok/app_icon_144x144.png',
    'ikonok/app_icon_192x192.png',
    'ikonok/app_icon_512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});
