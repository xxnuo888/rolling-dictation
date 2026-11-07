// dictation offline cache (http/https only; ignored under file://)
var CACHE = 'dictation-v3';
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil(self.clients.claim().then(function(){
    return caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
    });
  }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(function(cache){
      return cache.match(req).then(function(hit){
        var fetching = fetch(req).then(function(res){
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(function(){
          if (hit) return hit;
          if (req.mode === 'navigate') {
            return cache.match('./index.html')
              .then(function(r){ return r || cache.match('./chinese-dictation.html'); })
              .then(function(r){ return r || cache.match('./rolling-dictation.html'); });
          }
          return hit;
        });
        return hit || fetching;
      });
    })
  );
});
