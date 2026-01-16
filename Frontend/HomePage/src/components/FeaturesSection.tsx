import { 
  Users, 
  CreditCard, 
  Wifi, 
  BarChart3, 
  Bell, 
  Shield,
  Smartphone,
  Zap
} from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const features = [
  {
    icon: Users,
    title: "Manajemen Pelanggan",
    description: "Kelola data pelanggan lengkap dengan riwayat pembayaran, paket berlangganan, dan status koneksi dalam satu dashboard.",
    color: "primary" as const,
  },
  {
    icon: CreditCard,
    title: "Billing Otomatis",
    description: "Tagihan dikirim otomatis via WhatsApp. Integrasi pembayaran QRIS, transfer bank, dan e-wallet untuk kemudahan pelanggan.",
    color: "accent" as const,
  },
  {
    icon: Wifi,
    title: "Monitoring Jaringan",
    description: "Pantau status router, bandwidth usage, dan kualitas koneksi real-time. Deteksi masalah sebelum pelanggan komplain.",
    color: "primary" as const,
  },
  {
    icon: BarChart3,
    title: "Laporan Keuangan",
    description: "Laporan pendapatan, piutang, dan arus kas otomatis. Export ke Excel atau PDF untuk keperluan pajak dan analisis bisnis.",
    color: "accent" as const,
  },
  {
    icon: Bell,
    title: "Notifikasi WhatsApp",
    description: "Kirim pengingat tagihan, info gangguan, atau promo langsung ke WhatsApp pelanggan secara otomatis atau manual.",
    color: "primary" as const,
  },
  {
    icon: Shield,
    title: "Isolir & Aktivasi",
    description: "Blokir akses pelanggan yang menunggak dan aktifkan kembali otomatis setelah pembayaran dikonfirmasi.",
    color: "accent" as const,
  },
  {
    icon: Smartphone,
    title: "Aplikasi Mobile",
    description: "Kelola jaringan dari mana saja dengan aplikasi Android. Cocok untuk teknisi yang sering di lapangan.",
    color: "primary" as const,
  },
  {
    icon: Zap,
    title: "Integrasi Mikrotik",
    description: "Sinkronisasi otomatis dengan router Mikrotik untuk PPPoE, Hotspot, dan bandwidth management.",
    color: "accent" as const,
  },
];

const FeaturesSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.05 });

  return (
    <section id="features" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div 
          ref={headerRef}
          className={`text-center max-w-2xl mx-auto mb-16 transition-all duration-700 ${
            headerVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}
        >
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-6">
            <Zap className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium text-accent">Fitur Lengkap</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Semua yang Anda Butuhkan untuk{" "}
            <span className="text-gradient">Kelola RT RW Net</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Dari manajemen pelanggan hingga monitoring jaringan, semua fitur dirancang 
            khusus untuk kebutuhan ISP lokal dan RT RW Net di Indonesia.
          </p>
        </div>

        {/* Features grid */}
        <div 
          ref={gridRef}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={`group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
                gridVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-10'
              }`}
              style={{ 
                transitionDelay: gridVisible ? `${index * 100}ms` : '0ms'
              }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                feature.color === "primary" 
                  ? "bg-primary/10 group-hover:bg-primary/20" 
                  : "bg-accent/10 group-hover:bg-accent/20"
              } transition-colors duration-300`}>
                <feature.icon className={`w-6 h-6 ${
                  feature.color === "primary" ? "text-primary" : "text-accent"
                }`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>

              {/* Hover glow effect */}
              <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl ${
                feature.color === "primary" ? "bg-primary/5" : "bg-accent/5"
              }`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
