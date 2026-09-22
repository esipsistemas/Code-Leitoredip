const CACHE_NAME = "esip-radio-v1";

const ARQUIVOS = [
    "./",
    "./index.html",
    "./manifest.json"
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ARQUIVOS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(chaves => {
            return Promise.all(
                chaves
                    .filter(chave => chave !== CACHE_NAME)
                    .map(chave => caches.delete(chave))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {

    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    if (url.origin !== self.location.origin) {
        return;
    }

    if (request.mode === "navigate") {

        event.respondWith(
            fetch(request)
                .then(response => {

                    const copia = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(request, copia);
                        });

                    return response;
                })
                .catch(() => {
                    return caches.match(request);
                })
        );

        return;
    }

    event.respondWith(
        caches.match(request)
            .then(response => {
                return response || fetch(request);
            })
    );
});
