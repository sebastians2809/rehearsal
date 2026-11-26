/* Rehearsal · funciona sin internet y carga rápido en la tablet.
   Estrategia: primero la red (así siempre ves la última versión) y, si no hay internet, lo guardado. */
var CACHE='rehearsal-v1';
var FILES=['./','index.html','synth.js','acordes.js','canciones.js','estudio.js','guitarnotas.js','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','apple-touch-icon.png','fonts/nunito-latin-wght-normal.woff2','fonts/fredoka-latin-wght-normal.woff2'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  var r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  e.respondWith(fetch(r).then(function(res){
    if(res&&res.ok){var copy=res.clone();caches.open(CACHE).then(function(c){c.put(r,copy)})}
    return res;
  }).catch(function(){return caches.match(r).then(function(m){return m||caches.match('index.html')})}));
});
