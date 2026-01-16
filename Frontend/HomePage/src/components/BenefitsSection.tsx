import { Check, TrendingUp, Clock, Headphones } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const benefits = [
  {
    icon: TrendingUp,
    title: "Tingkatkan Pendapatan",
    description: "Tagihan otomatis mengurangi piutang. Pelanggan bayar tepat waktu karena reminder WhatsApp.",
    stats: "Piutang turun 60%",
  },
  {
    icon: Clock,
    title: "Hemat Waktu",
    description: "Tidak perlu input manual. Billing, laporan, dan monitoring berjalan otomatis 24/7.",
    stats: "10 jam/minggu",
  },
  {
    icon: Headphones,
    title: "Layanan Lebih Baik",
    description: "Deteksi gangguan lebih cepat. Pelanggan puas dengan respon yang profesional.",
    stats: "Komplain turun 45%",
  },
];

const checkpoints = [
  "Tidak perlu install server sendiri",
  "Bisa diakses dari HP atau laptop",
  "Update fitur gratis selamanya",
  "Support teknis via WhatsApp",
  "Backup data otomatis harian",
  "Cocok untuk 10 - 10.000 pelanggan",
];

const BenefitsSection = () => {
  const { ref: leftRef, isVisible: leftVisible } = useScrollAnimation();
  const { ref: rightRef, isVisible: rightVisible } = useScrollAnimation();

  return (
    <section id="benefits" className="py-24 bg-muted/30 relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Content */}
          <div
            ref={leftRef}
            className={`transition-all duration-700 ${
              leftVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 -translate-x-10'
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Kenapa NetManage?</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
              Solusi yang Dibuat{" "}
              <span className="text-gradient">Khusus untuk RT RW Net</span>
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              Kami paham tantangan mengelola jaringan komunitas. NetManage dirancang oleh 
              praktisi ISP lokal untuk memudahkan operasional harian Anda.
            </p>

            {/* Benefits cards */}
            <div className="space-y-4 mb-8">
              {benefits.map((benefit, index) => (
                <div
                  key={benefit.title}
                  className={`group flex items-start gap-4 bg-card rounded-xl p-4 border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-md ${
                    leftVisible 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-10'
                  }`}
                  style={{ 
                    transitionDelay: leftVisible ? `${(index + 1) * 150}ms` : '0ms'
                  }}
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors duration-300">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold text-foreground">{benefit.title}</h3>
                      <span className="text-sm font-medium text-accent">{benefit.stats}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right column - Checkpoints */}
          <div 
            ref={rightRef}
            className={`relative transition-all duration-700 delay-200 ${
              rightVisible 
                ? 'opacity-100 translate-x-0' 
                : 'opacity-0 translate-x-10'
            }`}
          >
            {/* Background card */}
            <div className="absolute inset-0 bg-gradient-primary opacity-5 rounded-3xl blur-3xl" />
            
            <div className="relative bg-card rounded-2xl p-8 border border-border shadow-lg">
              <h3 className="text-xl font-bold text-foreground mb-6">
                Apa yang Anda Dapatkan
              </h3>
              
              <div className="space-y-4">
                {checkpoints.map((item, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 group transition-all duration-500 ${
                      rightVisible 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 translate-x-5'
                    }`}
                    style={{ 
                      transitionDelay: rightVisible ? `${(index + 2) * 100}ms` : '0ms'
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center shrink-0 group-hover:bg-accent/30 transition-colors duration-300">
                      <Check className="w-4 h-4 text-accent" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              {/* Stats highlight */}
              <div className="mt-8 pt-6 border-t border-border">
                <div className="grid grid-cols-2 gap-4">
                  <div className={`text-center p-4 bg-muted/50 rounded-xl transition-all duration-700 ${
                    rightVisible 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-90'
                  }`} style={{ transitionDelay: rightVisible ? '600ms' : '0ms' }}>
                    <div className="text-3xl font-bold text-primary mb-1">500+</div>
                    <div className="text-sm text-muted-foreground">Jaringan Terdaftar</div>
                  </div>
                  <div className={`text-center p-4 bg-muted/50 rounded-xl transition-all duration-700 ${
                    rightVisible 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-90'
                  }`} style={{ transitionDelay: rightVisible ? '700ms' : '0ms' }}>
                    <div className="text-3xl font-bold text-accent mb-1">4.9/5</div>
                    <div className="text-sm text-muted-foreground">Rating Pengguna</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
