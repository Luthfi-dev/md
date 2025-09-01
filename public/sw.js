// Nama cache unik berdasarkan versi build untuk memastikan pembaruan otomatis
const CACHE_NAME = 'maudigi-cache-v1';

// Daftar aset inti yang akan selalu di-cache saat instalasi
const URLS_TO_CACHE = [
  '/',
  '/explore',
  '/notebook',
  '/account',
  '/login',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // Anda bisa menambahkan aset-aset krusial lainnya di sini
  // seperti file CSS atau JS utama jika diperlukan.
];

// Event: Install
// Dipicu saat service worker pertama kali diinstal.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Menginstal...');
  // Menunda event install sampai cache terisi
  (event as any).waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Membuka cache dan menambahkan aset inti');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => {
        console.log('Service Worker: Semua aset inti berhasil di-cache.');
        // Memaksa service worker yang sedang menunggu untuk menjadi aktif
        return (self as any).skipWaiting();
      })
  );
});

// Event: Activate
// Dipicu saat service worker diaktifkan. Berguna untuk membersihkan cache lama.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Mengaktifkan...');
  (event as any).waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Jika nama cache tidak sama dengan yang sekarang, hapus
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Menghapus cache lama:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('Service Worker: Klaim klien selesai.');
        return (self as any).clients.claim();
    })
  );
});

// Event: Fetch
// Dipicu setiap kali aplikasi membuat permintaan jaringan (request).
// Strategi: Cache-First (Coba ambil dari cache dulu, jika gagal baru ambil dari jaringan)
self.addEventListener('fetch', (event) => {
  const req = (event as any).request;
  
  // Hanya tangani permintaan GET
  if (req.method !== 'GET') {
    return;
  }

  (event as any).respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(req).then(response => {
        // Jika ada di cache, kembalikan dari cache
        if (response) {
          // console.log(`Service Worker: Mengambil dari cache: ${req.url}`);
          return response;
        }
        
        // Jika tidak ada di cache, ambil dari jaringan
        return fetch(req).then(networkResponse => {
            // console.log(`Service Worker: Mengambil dari jaringan: ${req.url}`);
            
            // Simpan respons jaringan ke cache untuk penggunaan berikutnya
            // Kita clone respons karena respons hanya bisa dibaca sekali
            cache.put(req, networkResponse.clone());

            return networkResponse;
        }).catch(err => {
            console.error('Service Worker: Gagal mengambil dari jaringan.', err);
            // Anda bisa menyediakan fallback offline di sini jika diperlukan
            // Contoh: return caches.match('/offline.html');
        });
      });
    })
  );
});