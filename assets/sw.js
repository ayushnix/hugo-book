{{- $styles := resources.Get "book.scss" | resources.ExecuteAsTemplate "book.scss" . | resources.ToCSS | resources.Minify | resources.Fingerprint }}

var staticCacheName = 'cache-v1';
var precacheResources = [
    './404.html',
    '{{ $styles.RelPermalink }}',
    './fonts/roboto-mono-v6-latin-regular.woff',
    './fonts/roboto-mono-v6-latin-regular.woff2',
    './fonts/roboto-v19-latin-300italic.woff',
    './fonts/roboto-v19-latin-300italic.woff2',
    './fonts/roboto-v19-latin-700.woff',
    './fonts/roboto-v19-latin-700.woff2',
    './fonts/roboto-v19-latin-regular.woff',
    './fonts/roboto-v19-latin-regular.woff2'
];

// ideally, these html pages should've been cached using the
// cache-then-strategy
precacheResources = precacheResources.concat([
{{ if eq .Site.Params.BookServiceWorker "precache" }}
  {{ range .Site.AllPages -}}
  "{{ .RelPermalink }}",
  {{ end -}}
{{ end }}
]);

// ON INSTALL - AS A DEPENDENCY
// install event; precache only critical static resources so that our app can
// work offline - CSS, JS, fonts, images
// we'll use skipWaiting() to activate a new service worker as soon as it is
// installed
self.addEventListener('install', event => {
    console.log("service worker installation event");
    console.log('the contents of pages is', precacheResources);
    self.skipWaiting();
    event.waitUntil(
        caches.open(staticCacheName)
        .then(cache => {
            return cache.addAll(precacheResources);
        })
    );
});

// ON ACTIVATE
// activate event; delete entries from the cache that are not present in our
// precache whitelist
// the cache is deleted only if the name of the new cache is different
// let's say the primary css file changed, the cache name can be changed to
// 'cache-v2' to trigger deletion of older cache
self.addEventListener('activate', event => {
    console.log('service worker activation event');

    const cacheWhitelist = [staticCacheName];

    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
    );
});

// CACHE FIRST STRATEGY or CACHE, FALLING BACK TO NETWORK
// fetch event; intercept network requests and serve them from the cache
// has flaws - updated content won't reflect unless user's cache is cleared
// we need the CACHE, THEN NETWORK strategy and may or may not include a
// generic fallack to `offline.html`
self.addEventListener('fetch', event => {
    console.log('fetch intercepted for:', event.request.url);
    event.respondWith(caches.match(event.request)
        .then(response => {
            return response || fetch(event.request);
      })
    );
});
