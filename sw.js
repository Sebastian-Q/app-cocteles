// ==============================
// A. CONFIGURACIÓN INICIAL
// ==============================
const CACHE_NAME = 'cocktail-pwa-v2';

// 1. Recursos del App Shell (Cache Only)
const appShellAssets = [
    './',
    './index.html',
    './main.js',
    './styles/main.css',
    './scripts/app.js',
    './images/icons/192.png',
    './images/icons/512.png',
];

// 2. JSON de Fallback para la API (usado cuando la red falla)
const OFFLINE_COCKTAIL_JSON = {
    drinks: [{
        idDrink: "00000",
        strDrink: "🚫 ¡Sin Conexión ni Datos Frescos!",
        strTags: "FALLBACK",
        strCategory: "Desconectado",
        strInstructions: "No pudimos obtener resultados en este momento. Este es un resultado GENÉRICO para demostrar que la aplicación NO SE ROMPE. Intenta conectarte de nuevo.",
        strDrinkThumb: "https://via.placeholder.com/200x300/667eea/ffffff?text=OFFLINE",
        strIngredient1: "Servicio Worker",
        strIngredient2: "Fallback JSON"
    }]
};

// ============================================================
// B. CICLO DE VIDA: INSTALACIÓN (PRECACHE)
// ============================================================
self.addEventListener('install', (event) => {
    console.log('[SW] ⚙️ Instalando y precacheando el App Shell...');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            // 1. Precacheo: Guardamos el App Shell
            return cache.addAll(appShellAssets);
        })
        .then(() => self.skipWaiting()) // Forzamos la activación
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] 🚀 Service Worker Activado.');
    // Opcional: Limpieza de cachés antiguas aquí
    event.waitUntil(
        caches.keys().then((cacheNames) => {
        return Promise.all(
            cacheNames
            .filter((name) => name !== CACHE_NAME) // Mantén solo la versión actual
            .map((oldCache) => {
                console.log(`[SW] 🧹 Eliminando caché antigua: ${oldCache}`);
                return caches.delete(oldCache);
            })
        );
        }).then(() => self.clients.claim()) // Control inmediato de las páginas
    );
});

// ============================================================
// C. CICLO DE VIDA: FETCH (ESTRATEGIAS)
// ============================================================
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    // --- ESTRATEGIA 1: CACHE ONLY (para el App Shell) ---
    const isAppShellRequest = appShellAssets.some(asset =>
        requestUrl.pathname === asset || requestUrl.pathname === asset.substring(1)
    );

    if (isAppShellRequest) {
        console.log(`[SW] 🔒 App Shell: CACHE ONLY para ${requestUrl.pathname}`);
        event.respondWith(
            caches.match(event.request)
            .then((response) => {
                // Devolvemos la respuesta de caché o un error 500 si falta el archivo
                return response || new Response('App Shell Asset Missing', { status: 500 });
            })
        );
        return;
    }

    // --- ESTRATEGIA 2: NETWORK-FIRST con FALLBACK de JSON (para la API) ---
    // --- ESTRATEGIA 2: NETWORK-FIRST con CACHE FALLBACK ---
    // --- ESTRATEGIA 2: NETWORK-FIRST con CACHE FALLBACK + ALERTA ---
    if (requestUrl.host === 'www.thecocktaildb.com' && requestUrl.pathname.includes('/search.php')) {
        console.log('[SW] 🔄 API: NETWORK-FIRST con caché dinámico.');

        event.respondWith(
            caches.open(CACHE_NAME).then(async (cache) => {
                try {
                    // 🌐 Intentar conexión a internet
                    const networkResponse = await fetch(event.request);
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                } catch (error) {
                    console.log('[SW] ❌ Sin conexión, buscando en caché...');
                    const cachedResponse = await cache.match(event.request);

                    if (cachedResponse) {
                        // ✅ Devuelve la respuesta guardada, marcándola con un header especial
                        const modifiedHeaders = new Headers(cachedResponse.headers);
                        modifiedHeaders.set('X-Cache-Status', 'HIT');

                        const clonedBody = await cachedResponse.clone().blob();
                        return new Response(clonedBody, {
                            status: 200,
                            statusText: 'OK (cached)',
                            headers: modifiedHeaders
                        });
                    }

                    // 🚫 No hay conexión ni caché → devolver JSON especial
                    console.log('[SW] ⚠️ No hay datos guardados.');
                    return new Response(JSON.stringify(OFFLINE_COCKTAIL_JSON), {
                        headers: { 
                            'Content-Type': 'application/json',
                            'X-Cache-Status': 'MISS'
                        }
                    });
                }
            })
        );
        return;
    }
});