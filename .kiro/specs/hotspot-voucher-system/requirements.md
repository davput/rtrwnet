# Dokumen Requirements

## Pendahuluan

Sistem Hotspot Voucher memungkinkan operator RT/RW Net (tenant) untuk mengelola akses WiFi hotspot melalui autentikasi berbasis voucher. Sistem ini menyediakan pembuatan voucher, manajemen user, login captive portal, autentikasi/otorisasi/accounting RADIUS, monitoring real-time, dan isolasi multi-tenant. Fitur ini sangat penting bagi operator yang ingin memonetisasi akses WiFi publik di lingkungan mereka.

## Glosarium

- **Sistem Hotspot**: Sistem kontrol akses WiFi yang mengautentikasi pengguna melalui voucher
- **Voucher**: Kredensial akses berbatas waktu yang berisi username dan password untuk login hotspot
- **Captive Portal**: Halaman web yang mengintersep traffic pengguna dan memerlukan autentikasi sebelum akses internet
- **RADIUS Server**: Remote Authentication Dial-In User Service - menangani autentikasi, otorisasi, dan accounting
- **NAS (Network Access Server)**: Router atau access point yang meneruskan permintaan autentikasi ke RADIUS
- **Tenant**: Operator RT/RW Net yang mengelola infrastruktur hotspot mereka sendiri
- **Pengguna Hotspot**: Pengguna akhir yang membeli dan menggunakan voucher untuk mengakses internet
- **Sesi**: Periode akses internet yang terautentikasi oleh pengguna hotspot
- **MAC Address**: Media Access Control address - identifier unik untuk perangkat jaringan
- **Profil**: Konfigurasi yang mendefinisikan batas bandwidth dan durasi akses untuk paket layanan

## Requirements

### Requirement 1

**User Story:** Sebagai admin tenant, saya ingin membuat dan mengelola pengguna hotspot, sehingga saya dapat mengontrol siapa yang memiliki akses ke jaringan WiFi saya.

#### Kriteria Penerimaan

1. KETIKA admin tenant membuat pengguna hotspot dengan username, password, dan paket, MAKA Sistem Hotspot HARUS menyimpan kredensial pengguna dan mengasosiasikannya dengan paket yang ditentukan
2. KETIKA admin tenant menghapus pengguna hotspot, MAKA Sistem Hotspot HARUS menghapus pengguna dan mengakhiri semua sesi aktif
3. KETIKA pengguna hotspot dibuat, MAKA Sistem Hotspot HARUS memberlakukan batas perangkat 1-2 perangkat bersamaan per akun
4. KETIKA paket pengguna hotspot kedaluwarsa, MAKA Sistem Hotspot HARUS secara otomatis menonaktifkan akun pengguna
5. KETIKA admin tenant melihat daftar pengguna, MAKA Sistem Hotspot HARUS menampilkan username, paket, tanggal kedaluwarsa, jumlah perangkat, dan status

### Requirement 2

**User Story:** Sebagai admin tenant, saya ingin menghasilkan voucher secara otomatis, sehingga saya dapat dengan cepat membuat kode akses untuk pelanggan tanpa input manual.

#### Kriteria Penerimaan

1. KETIKA admin tenant meminta pembuatan voucher dengan jumlah dan tipe paket, MAKA Sistem Hotspot HARUS membuat pasangan username-password unik untuk setiap voucher
2. KETIKA voucher dihasilkan, MAKA Sistem Hotspot HARUS memastikan semua username unik dalam lingkup tenant
3. KETIKA admin tenant menghasilkan voucher, MAKA Sistem Hotspot HARUS mendukung pembuatan batch hingga 100 voucher sekaligus
4. KETIKA voucher dibuat, MAKA Sistem Hotspot HARUS menetapkan paket durasi yang ditentukan (per jam atau per hari) ke setiap voucher
5. KETIKA admin tenant melihat voucher yang dihasilkan, MAKA Sistem Hotspot HARUS menampilkan kode voucher, paket, status, dan tanggal kedaluwarsa

### Requirement 3

**User Story:** Sebagai admin tenant, saya ingin mendefinisikan paket berbasis durasi, sehingga saya dapat menawarkan tingkat harga yang berbeda untuk akses hotspot.

#### Kriteria Penerimaan

1. KETIKA admin tenant membuat paket dengan durasi dalam jam atau hari, MAKA Sistem Hotspot HARUS menyimpan konfigurasi paket dengan nama, durasi, dan profil bandwidth
2. KETIKA paket ditetapkan ke voucher, MAKA Sistem Hotspot HARUS menghitung timestamp kedaluwarsa berdasarkan waktu login pertama ditambah durasi
3. KETIKA admin tenant mendefinisikan paket, MAKA Sistem Hotspot HARUS mengizinkan spesifikasi batas kecepatan upload dan download
4. KETIKA durasi paket kedaluwarsa, MAKA Sistem Hotspot HARUS mencegah upaya autentikasi lebih lanjut menggunakan voucher tersebut
5. KETIKA admin tenant memperbarui paket, MAKA Sistem Hotspot HARUS menerapkan perubahan hanya pada voucher baru, bukan pengguna aktif yang ada

### Requirement 4

**User Story:** Sebagai pengguna hotspot, saya ingin login melalui captive portal, sehingga saya dapat mengakses internet menggunakan kredensial voucher saya.

#### Kriteria Penerimaan

1. KETIKA pengguna hotspot terhubung ke jaringan WiFi, MAKA Captive Portal HARUS mengintersep traffic HTTP dan menampilkan halaman login
2. KETIKA pengguna hotspot mengirimkan kredensial yang valid, MAKA Captive Portal HARUS mengautentikasi melalui RADIUS dan memberikan akses internet
3. KETIKA pengguna hotspot mengirimkan kredensial yang tidak valid, MAKA Captive Portal HARUS menampilkan pesan error dan tetap di halaman login
4. KETIKA pengguna hotspot berhasil login, MAKA Captive Portal HARUS redirect ke halaman sukses atau URL yang ditentukan
5. KETIKA halaman login dimuat, MAKA Captive Portal HARUS menampilkan logo tenant dan teks promosi

### Requirement 5

**User Story:** Sebagai admin tenant, saya ingin menyesuaikan captive portal saya, sehingga saya dapat memberi brand pada pengalaman login untuk pelanggan saya.

#### Kriteria Penerimaan

1. KETIKA admin tenant mengunggah gambar logo, MAKA Sistem Hotspot HARUS menyimpan gambar dan menampilkannya di captive portal
2. KETIKA admin tenant mengatur teks promosi, MAKA Sistem Hotspot HARUS menampilkan teks di halaman login captive portal
3. KETIKA admin tenant mengkonfigurasi URL redirect, MAKA Captive Portal HARUS redirect pengguna yang terautentikasi ke URL tersebut
4. KETIKA admin tenant memperbarui pengaturan portal, MAKA Sistem Hotspot HARUS menerapkan perubahan segera ke sesi login baru
5. KETIKA captive portal dimuat, MAKA Captive Portal HARUS menggunakan branding spesifik tenant berdasarkan identifier NAS

### Requirement 6

**User Story:** Sebagai RADIUS server, saya ingin mengautentikasi pengguna hotspot, sehingga hanya pemegang voucher yang valid yang dapat mengakses jaringan.

#### Kriteria Penerimaan

1. KETIKA NAS mengirim Access-Request dengan username dan password, MAKA RADIUS Server HARUS memverifikasi kredensial terhadap database pengguna hotspot
2. KETIKA kredensial valid dan tidak kedaluwarsa, MAKA RADIUS Server HARUS merespons dengan Access-Accept dan menyertakan atribut profil bandwidth
3. KETIKA kredensial tidak valid atau kedaluwarsa, MAKA RADIUS Server HARUS merespons dengan Access-Reject
4. KETIKA pengguna mencoba login dari perangkat ketiga, MAKA RADIUS Server HARUS menolak autentikasi karena batas perangkat
5. KETIKA RADIUS Server mengautentikasi pengguna, MAKA RADIUS Server HARUS mencatat MAC address untuk pelacakan perangkat

### Requirement 7

**User Story:** Sebagai RADIUS server, saya ingin mengotorisasi profil bandwidth, sehingga pengguna menerima batas kecepatan yang benar untuk paket mereka.

#### Kriteria Penerimaan

1. KETIKA RADIUS Server mengirim Access-Accept, MAKA RADIUS Server HARUS menyertakan batas kecepatan upload dalam atribut Mikrotik-Rate-Limit
2. KETIKA RADIUS Server mengirim Access-Accept, MAKA RADIUS Server HARUS menyertakan batas kecepatan download dalam atribut Mikrotik-Rate-Limit
3. KETIKA paket pengguna mendefinisikan batas bandwidth, MAKA RADIUS Server HARUS memformat batas sebagai "upload/download" dalam bit per detik
4. KETIKA NAS menerima atribut otorisasi, MAKA NAS HARUS memberlakukan batas bandwidth pada sesi pengguna
5. KETIKA pengguna tidak memiliki paket aktif, MAKA RADIUS Server HARUS menolak otorisasi

### Requirement 8

**User Story:** Sebagai RADIUS server, saya ingin melacak accounting sesi, sehingga saya dapat memantau durasi penggunaan dan memberlakukan batas waktu.

#### Kriteria Penerimaan

1. KETIKA NAS mengirim Accounting-Start, MAKA RADIUS Server HARUS membuat record sesi dengan waktu mulai, username, IP, dan MAC address
2. KETIKA NAS mengirim Accounting-Interim-Update, MAKA RADIUS Server HARUS memperbarui sesi dengan byte yang ditransfer saat ini dan durasi sesi
3. KETIKA NAS mengirim Accounting-Stop, MAKA RADIUS Server HARUS menutup sesi dan mencatat total durasi dan byte yang ditransfer
4. KETIKA sesi melebihi durasi paket, MAKA RADIUS Server HARUS menandai pengguna sebagai kedaluwarsa dan menolak autentikasi di masa depan
5. KETIKA RADIUS Server menerima paket accounting, MAKA RADIUS Server HARUS menyimpan semua data sesi dalam database untuk pelaporan

### Requirement 9

**User Story:** Sebagai admin tenant, saya ingin memantau pengguna hotspot aktif secara real-time, sehingga saya dapat melihat siapa yang sedang online.

#### Kriteria Penerimaan

1. KETIKA admin tenant melihat dashboard monitoring, MAKA Sistem Hotspot HARUS menampilkan semua sesi aktif saat ini untuk tenant tersebut
2. KETIKA menampilkan sesi aktif, MAKA Sistem Hotspot HARUS menunjukkan username, alamat IP, MAC address, durasi koneksi, dan byte yang ditransfer
3. KETIKA admin tenant me-refresh tampilan monitoring, MAKA Sistem Hotspot HARUS memperbarui data sesi dalam 5 detik
4. KETIKA sesi berakhir, MAKA Sistem Hotspot HARUS menghapusnya dari daftar sesi aktif dalam 30 detik
5. KETIKA menampilkan durasi sesi, MAKA Sistem Hotspot HARUS memformatnya sebagai jam:menit:detik

### Requirement 10

**User Story:** Sebagai admin tenant, saya ingin memutuskan koneksi pengguna secara paksa, sehingga saya dapat mengelola sumber daya jaringan dan menangani pelanggaran kebijakan.

#### Kriteria Penerimaan

1. KETIKA admin tenant mengklik disconnect pada sesi aktif, MAKA Sistem Hotspot HARUS mengirim permintaan disconnect ke NAS melalui RADIUS
2. KETIKA NAS menerima permintaan disconnect, MAKA NAS HARUS mengakhiri sesi pengguna segera
3. KETIKA sesi diputuskan, MAKA Sistem Hotspot HARUS memperbarui status sesi menjadi "disconnected" dalam database
4. KETIKA pengguna yang terputus mencoba menyambung kembali, MAKA RADIUS Server HARUS mengizinkan autentikasi ulang jika voucher masih valid
5. KETIKA operasi disconnect gagal, MAKA Sistem Hotspot HARUS menampilkan pesan error kepada admin tenant

### Requirement 11

**User Story:** Sebagai admin tenant, saya ingin melacak penjualan dan penggunaan voucher, sehingga saya dapat memantau pendapatan dan popularitas paket.

#### Kriteria Penerimaan

1. KETIKA admin tenant melihat dashboard billing, MAKA Sistem Hotspot HARUS menampilkan total voucher yang terjual per tipe paket
2. KETIKA menampilkan statistik voucher, MAKA Sistem Hotspot HARUS menunjukkan voucher yang digunakan, voucher yang tidak digunakan, dan voucher yang kedaluwarsa
3. KETIKA admin tenant memfilter berdasarkan rentang tanggal, MAKA Sistem Hotspot HARUS menampilkan penjualan voucher untuk periode tersebut
4. KETIKA menghitung pendapatan, MAKA Sistem Hotspot HARUS mengalikan jumlah voucher dengan harga paket untuk setiap tipe paket
5. KETIKA voucher pertama kali digunakan, MAKA Sistem Hotspot HARUS mencatat timestamp aktivasi

### Requirement 12

**User Story:** Sebagai administrator platform, saya ingin mengisolasi data hotspot per tenant, sehingga setiap operator RT/RW Net memiliki manajemen hotspot yang independen.

#### Kriteria Penerimaan

1. KETIKA pengguna hotspot dibuat, MAKA Sistem Hotspot HARUS mengasosiasikan pengguna dengan tenant ID
2. KETIKA RADIUS Server mengautentikasi pengguna, MAKA RADIUS Server HARUS memverifikasi pengguna milik tenant yang diidentifikasi oleh NAS secret
3. KETIKA admin tenant melakukan query pengguna atau sesi, MAKA Sistem Hotspot HARUS mengembalikan hanya data yang milik tenant tersebut
4. KETIKA NAS terhubung ke RADIUS, MAKA RADIUS Server HARUS mengidentifikasi tenant menggunakan NAS shared secret
5. KETIKA data tenant di-query, MAKA Sistem Hotspot HARUS memberlakukan keamanan tingkat baris berdasarkan tenant ID

### Requirement 13

**User Story:** Sebagai admin tenant, saya ingin mengkonfigurasi RADIUS secret untuk perangkat jaringan saya, sehingga router saya dapat mengautentikasi dengan RADIUS server.

#### Kriteria Penerimaan

1. KETIKA admin tenant menambahkan perangkat NAS dengan alamat IP dan shared secret, MAKA Sistem Hotspot HARUS menyimpan konfigurasi NAS
2. KETIKA RADIUS Server menerima permintaan dari NAS, MAKA RADIUS Server HARUS memverifikasi shared secret cocok dengan nilai yang dikonfigurasi
3. KETIKA NAS secret salah, MAKA RADIUS Server HARUS menolak semua permintaan autentikasi dari NAS tersebut
4. KETIKA admin tenant memperbarui NAS secret, MAKA RADIUS Server HARUS menggunakan secret baru untuk permintaan berikutnya
5. KETIKA admin tenant menghapus NAS, MAKA RADIUS Server HARUS menolak semua permintaan dari alamat IP NAS tersebut

### Requirement 14

**User Story:** Sebagai admin tenant, saya ingin memberlakukan binding MAC address, sehingga voucher tidak dapat dibagikan ke beberapa perangkat.

#### Kriteria Penerimaan

1. KETIKA pengguna hotspot pertama kali mengautentikasi, MAKA Sistem Hotspot HARUS mencatat MAC address perangkat
2. KETIKA pengguna hotspot mengautentikasi dari MAC address yang berbeda, MAKA RADIUS Server HARUS menolak autentikasi
3. KETIKA admin tenant mengaktifkan MAC binding untuk paket, MAKA Sistem Hotspot HARUS memberlakukan validasi MAC address untuk semua pengguna dengan paket tersebut
4. KETIKA admin tenant menonaktifkan MAC binding, MAKA RADIUS Server HARUS mengizinkan autentikasi dari MAC address apa pun hingga batas perangkat
5. KETIKA MAC address pengguna terikat, MAKA Sistem Hotspot HARUS menampilkan MAC address yang terikat di detail pengguna

### Requirement 15

**User Story:** Sebagai sistem, saya ingin secara otomatis memutuskan sesi yang kedaluwarsa, sehingga pengguna tidak dapat terus menggunakan jaringan setelah waktu mereka habis.

#### Kriteria Penerimaan

1. KETIKA durasi sesi melebihi batas waktu paket, MAKA Sistem Hotspot HARUS menandai sesi sebagai kedaluwarsa
2. KETIKA sesi ditandai kedaluwarsa, MAKA Sistem Hotspot HARUS mengirim permintaan disconnect ke NAS
3. KETIKA sistem memeriksa sesi yang kedaluwarsa, MAKA Sistem Hotspot HARUS menjalankan pemeriksaan setiap 60 detik
4. KETIKA pengguna diputuskan karena kedaluwarsa, MAKA Sistem Hotspot HARUS mencegah autentikasi ulang dengan voucher yang sama
5. KETIKA pengguna yang kedaluwarsa mencoba login, MAKA RADIUS Server HARUS merespons dengan Access-Reject dan pesan kedaluwarsa

### Requirement 16

**User Story:** Sebagai admin tenant, saya ingin mengatur batas sesi per pengguna, sehingga saya dapat mencegah penyalahgunaan dan memastikan penggunaan yang adil.

#### Kriteria Penerimaan

1. KETIKA paket mendefinisikan batas sesi bersamaan, MAKA RADIUS Server HARUS memberlakukan jumlah maksimum sesi simultan
2. KETIKA pengguna mencoba melebihi batas sesi, MAKA RADIUS Server HARUS menolak permintaan autentikasi baru
3. KETIKA sesi berakhir, MAKA Sistem Hotspot HARUS mengurangi jumlah sesi aktif untuk pengguna tersebut
4. KETIKA admin tenant mengkonfigurasi batas sesi, MAKA Sistem Hotspot HARUS menerapkan batas ke semua pengguna dengan paket tersebut
5. KETIKA menampilkan sesi aktif, MAKA Sistem Hotspot HARUS menunjukkan jumlah sesi saat ini versus batas
