/* =========================================================
   ESIP - RÁDIO TÁTICO P2P
   SERVICE WORKER / PWA
   VERSÃO SEM ÍCONES
========================================================= */

const VERSAO_CACHE = "esip-radio-v2";

const RECURSOS_APP = [
    "./",
    "./index.html",
    "./manifest.json"
];

/* =========================
   INSTALAÇÃO
========================= */

self.addEventListener("install", event => {

    console.log("[ESIP] Instalando Service Worker...");

    event.waitUntil(

        caches.open(VERSAO_CACHE)
            .then(cache => {

                return cache.addAll(RECURSOS_APP);

            })

    );

    self.skipWaiting();

});


/* =========================
   ATIVAÇÃO
========================= */

self.addEventListener("activate", event => {

    console.log("[ESIP] Ativando Service Worker...");

    event.waitUntil(

        caches.keys()
            .then(nomesCaches => {

                return Promise.all(

                    nomesCaches.map(nomeCache => {

                        if (nomeCache !== VERSAO_CACHE) {

                            console.log(
                                "[ESIP] Removendo cache antigo:",
                                nomeCache
                            );

                            return caches.delete(nomeCache);

                        }

                    })

                );

            })

            .then(() => {

                return self.clients.claim();

            })

    );

});


/* =========================
   INTERCEPTAÇÃO DE REQUISIÇÕES
========================= */

self.addEventListener("fetch", event => {

    const request = event.request;

    /* Somente GET */
    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    /* Não interfere em PeerJS,
       Google Maps ou outros sites externos */
    if (url.origin !== self.location.origin) {
        return;
    }

    event.respondWith(

        caches.match(request)

            .then(respostaCache => {

                if (respostaCache) {

                    return respostaCache;

                }

                return fetch(request)

                    .then(respostaRede => {

                        if (
                            !respostaRede ||
                            respostaRede.status !== 200
                        ) {

                            return respostaRede;

                        }

                        const copia = respostaRede.clone();

                        caches.open(VERSAO_CACHE)
                            .then(cache => {

                                cache.put(
                                    request,
                                    copia
                                );

                            });

                        return respostaRede;

                    })

                    .catch(() => {

                        /* Se estiver offline,
                           tenta carregar o index */

                        if (request.mode === "navigate") {

                            return caches.match(
                                "./index.html"
                            );

                        }

                        return new Response(
                            "",
                            {
                                status: 503,
                                statusText: "Offline"
                            }
                        );

                    });

            })

    );

});


/* =========================
   COMANDO PARA NOVA VERSÃO
========================= */

self.addEventListener("message", event => {

    if (
        event.data &&
        event.data.tipo === "ATIVAR_NOVA_VERSAO"
    ) {

        self.skipWaiting();

    }

});
