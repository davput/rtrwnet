import { Star, Quote } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const testimonials = [
  {
    name: "Pak Agus Suryanto",
    role: "Pemilik RT RW Net Serpong",
    content: "Sebelumnya saya catat tagihan di Excel, sering lupa tagih pelanggan. Sekarang dengan NetManage, reminder otomatis ke WA, piutang saya turun drastis dalam 2 bulan!",
    rating: 5,
    customers: "120 pelanggan",
  },
  {
    name: "Bu Siti Rahayu",
    role: "Pengelola ISP Desa Sukamaju",
    content: "Aplikasinya mudah banget dipakai. Saya yang gaptek aja bisa. Sekarang anak-anak bisa bantu kelola dari HP masing-masing. Laporan keuangan juga rapi.",
    rating: 5,
    customers: "80 pelanggan",
  },
  {
    name: "Mas Budi Santoso",
    role: "Teknisi Jaringan Freelance",
    content: "Saya handle 5 jaringan RT RW Net. Dengan NetManage, semua bisa dipantau dari satu dashboard. Monitoring Mikrotik-nya juga bagus, bisa lihat traffic real-time.",
    rating: 5,
    customers: "350 pelanggan",
  },
];

const TestimonialsSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section id="testimonials" className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />
      
      <div className="container mx-auto px-4 relative">
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
            <Star className="w-4 h-4 text-accent fill-accent" />
            <span className="text-sm font-medium text-accent">Testimoni</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Dipercaya oleh{" "}
            <span className="text-gradient">Ratusan Pengelola Jaringan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Lihat bagaimana NetManage membantu pemilik RT RW Net di seluruh Indonesia 
            mengelola bisnis mereka dengan lebih profesional.
          </p>
        </div>

        {/* Testimonials grid */}
        <div ref={gridRef} className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.name}
              className={`group relative bg-card rounded-2xl p-6 border border-border hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${
                gridVisible 
                  ? 'opacity-100 translate-y-0 rotate-0' 
                  : 'opacity-0 translate-y-10 rotate-2'
              }`}
              style={{ 
                transitionDelay: gridVisible ? `${index * 150}ms` : '0ms'
              }}
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 text-primary/10 group-hover:text-primary/20 transition-colors duration-300">
                <Quote className="w-10 h-10" />
              </div>

              {/* Rating */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-5 h-5 text-accent fill-accent transition-all duration-300 ${
                      gridVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-0'
                    }`}
                    style={{ 
                      transitionDelay: gridVisible ? `${index * 150 + i * 50 + 200}ms` : '0ms'
                    }}
                  />
                ))}
              </div>

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed relative z-10">
                "{testimonial.content}"
              </p>

              {/* Author */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-primary">{testimonial.customers}</div>
                </div>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-xl" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
