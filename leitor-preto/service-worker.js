/* =========================================================
   ESIP - RÁDIO TÁTICO P2P
   SERVICE WORKER / PWA
========================================================= */

const VERSAO_CACHE = "esip-radio-v1";

const RECURSOS_APP = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icon-192.png",
    "./icon-512.png"
];


/* =========================================================
   INSTALAÇÃO
========================================================= */

self.addEventListener("install", event => {

    console.log(
        "[ESIP] Instalando Service Worker..."
    );

    event.waitUntil(

        caches.open(VERSAO_CACHE)
            .then(cache => {

                return cache.addAll(
                    RECURSOS_APP
                );

            })

    );

    /*
     * Permite que a nova versão seja ativada
     * sem esperar o encerramento da versão antiga.
     */

    self.skipWaiting();

});


/* =========================================================
   ATIVAÇÃO
========================================================= */

self.addEventListener("activate", event => {

    console.log(
        "[ESIP] Ativando Service Worker..."
    );

    event.waitUntil(

        caches.keys()
            .then(nomesCaches => {

                return Promise.all(

                    nomesCaches.map(nomeCache => {

                        if (
                            nomeCache !==
                            VERSAO_CACHE
                        ) {

                            console.log(
                                "[ESIP] Removendo cache antigo:",
                                nomeCache
                            );

                            return caches.delete(
                                nomeCache
                            );
                        }

                    })

                );

            })
            .then(() => {

                /*
                 * Assume imediatamente o controle
                 * das páginas abertas.
                 */

                return self.clients.claim();

            })

    );

});


/* =========================================================
   REQUISIÇÕES
========================================================= */

self.addEventListener(
    "fetch",
    event => {

        const request =
            event.request;


        /*
         * Somente requisições GET.
         *
         * POST, WebRTC, PeerJS e outras operações
         * dinâmicas não serão interceptadas.
         */

        if (
            request.method !== "GET"
        ) {
            return;
        }


        /*
         * Não interferir em requisições
         * de outros domínios.
         *
         * Isso é importante para o PeerJS,
         * Google Maps e outros serviços externos.
         */

        const url =
            new URL(request.url);

        if (
            url.origin !==
            self.location.origin
        ) {
            return;
        }


        /*
         * Estratégia:
         *
         * 1. Procura no cache.
         * 2. Se não encontrar, busca na rede.
         * 3. Se conseguir, guarda no cache.
         */

        event.respondWith(

            caches.match(request)
                .then(respostaCache => {

                    if (
                        respostaCache
                    ) {

                        return respostaCache;
                    }


                    return fetch(request)
                        .then(respostaRede => {

                            /*
                             * Só armazena respostas
                             * válidas.
                             */

                            if (
                                !respostaRede ||
                                respostaRede.status !== 200
                            ) {

                                return respostaRede;
                            }


                            const copia =
                                respostaRede.clone();


                            caches.open(
                                VERSAO_CACHE
                            )
                            .then(cache => {

                                cache.put(
                                    request,
                                    copia
                                );

                            });


                            return respostaRede;

                        })

                        .catch(() => {

                            /*
                             * Se estiver sem internet
                             * e for uma navegação,
                             * tenta abrir o app pelo
                             * conteúdo previamente salvo.
                             */

                            if (
                                request.mode ===
                                "navigate"
                            ) {

                                return caches.match(
                                    "./index.html"
                                );

                            }


                            return new Response(
                                "",
                                {
                                    status: 503,
                                    statusText:
                                        "Offline"
                                }
                            );

                        });

                })

        );

    }
);


/* =========================================================
   MENSAGEM PARA ATUALIZAÇÃO MANUAL
========================================================= */

self.addEventListener(
    "message",
    event => {

        if (
            event.data &&
            event.data.tipo ===
            "ATIVAR_NOVA_VERSAO"
        ) {

            self.skipWaiting();

        }

    }
);
