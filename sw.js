// ===== 穎利打卡 Service Worker =====
// 更新策略：網路優先，抓不到才用快取（確保員工永遠拿到最新版）
const CACHE = 'winz-punch-v1';   // ★改版時把 v1 改 v2、v3... 強制更新

// 安裝：立即接管，不等舊的關閉
self.addEventListener('install', function(e){
  self.skipWaiting();  // 新版馬上生效，不用等所有分頁關掉
});

// 啟用：清掉舊版快取
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){
        if (k !== CACHE) return caches.delete(k);  // 刪掉非當前版本的快取
      }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// 抓取：網路優先（Network First）
// 有網路 → 一定拿最新；沒網路 → 退快取（離線也能開殼）
self.addEventListener('fetch', function(e){
  // 只處理同源的 GET；GAS/外部請求（打卡API）不攔，直接放行
  if (e.request.method !== 'GET') return;
  var url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;  // 外部（GAS等）不快取

  e.respondWith(
    fetch(e.request).then(function(res){
      // 拿到新的就更新快取
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
      return res;
    }).catch(function(){
      return caches.match(e.request);  // 沒網路 → 用快取
    })
  );
});
