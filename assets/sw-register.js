{{- $swJS := resources.Get "sw.js" | resources.ExecuteAsTemplate "sw.js" . -}}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register("{{ $swJS.RelPermalink }}")
          .then(reg => {
              console.log('service worker registered', reg);
          }).catch(err => {
            console.log('service worker registration failed', err);
        });
    });
}
