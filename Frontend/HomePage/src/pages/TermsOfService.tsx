import { Link } from "react-router-dom";
import { ArrowLeft, Network, FileText } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6 border-b border-border/50">
        <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Kembali</span>
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:block">WiFi Voucherio</span>
        </Link>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-border/50 shadow-2xl">
          {/* Title */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center">
              <FileText className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Syarat dan Ketentuan</h1>
              <p className="text-muted-foreground text-sm">Terakhir diperbarui: 26 Desember 2024</p>
            </div>
          </div>

          {/* Terms Content */}
          <div className="prose prose-invert max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Pendahuluan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Selamat datang di WiFi Voucherio. Dengan mengakses dan menggunakan layanan kami, Anda menyetujui untuk terikat dengan syarat dan ketentuan berikut. Harap baca dengan seksama sebelum menggunakan layanan kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Definisi Layanan</h2>
              <p className="text-muted-foreground leading-relaxed">
                WiFi Voucherio adalah platform manajemen jaringan WiFi yang menyediakan layanan termasuk namun tidak terbatas pada:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Manajemen pelanggan dan billing</li>
                <li>Pembuatan dan pengelolaan voucher</li>
                <li>Monitoring jaringan</li>
                <li>Laporan keuangan dan analytics</li>
                <li>Integrasi dengan perangkat Mikrotik</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Akun Pengguna</h2>
              <p className="text-muted-foreground leading-relaxed">
                Anda bertanggung jawab untuk menjaga kerahasiaan akun dan password Anda. Anda setuju untuk segera memberitahu kami tentang penggunaan tidak sah atas akun Anda. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan akun Anda oleh pihak ketiga.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Periode Trial Gratis</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menawarkan periode trial gratis selama 7 hari untuk pengguna baru. Selama periode ini:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Anda memiliki akses penuh ke semua fitur premium</li>
                <li>Tidak diperlukan informasi kartu kredit</li>
                <li>Trial akan berakhir otomatis setelah 7 hari</li>
                <li>Anda dapat mengupgrade ke paket berbayar kapan saja</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Pembayaran dan Penagihan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Untuk paket berbayar, pembayaran dilakukan di muka secara bulanan atau tahunan. Kami menggunakan payment gateway yang aman untuk memproses pembayaran Anda. Semua harga yang ditampilkan belum termasuk pajak yang berlaku.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Kebijakan Pengembalian Dana</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menawarkan garansi 30 hari uang kembali untuk semua paket berbayar. Jika Anda tidak puas dengan layanan kami dalam 30 hari pertama, Anda berhak mendapatkan pengembalian dana penuh tanpa pertanyaan.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Privasi Data</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami menghargai privasi Anda. Data pelanggan Anda disimpan dengan aman dan tidak akan dibagikan kepada pihak ketiga tanpa persetujuan Anda. Untuk informasi lebih lanjut, silakan baca Kebijakan Privasi kami.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Pembatasan Penggunaan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Anda setuju untuk tidak menggunakan layanan kami untuk:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                <li>Aktivitas yang melanggar hukum</li>
                <li>Menyebarkan malware atau virus</li>
                <li>Mengganggu layanan pengguna lain</li>
                <li>Melakukan reverse engineering pada sistem kami</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Perubahan Ketentuan</h2>
              <p className="text-muted-foreground leading-relaxed">
                Kami berhak mengubah syarat dan ketentuan ini kapan saja. Perubahan akan diumumkan melalui email atau notifikasi dalam aplikasi. Penggunaan layanan setelah perubahan berarti Anda menyetujui ketentuan yang baru.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Kontak</h2>
              <p className="text-muted-foreground leading-relaxed">
                Jika Anda memiliki pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di:
              </p>
              <p className="text-primary mt-2">support@wifivoucherio.com</p>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
