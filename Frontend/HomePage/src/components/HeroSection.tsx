import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Wifi, Users, BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <section className="relative min-h-screen bg-gradient-hero overflow-hidden pt-16">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl transition-all duration-1000 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`} />
        <div className={`absolute bottom-20 right-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl transition-all duration-1000 delay-300 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
        }`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl transition-all duration-1500 delay-500 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
        }`} />
      </div>

      {/* Grid pattern overlay */}
      <div 
        className={`absolute inset-0 transition-opacity duration-1000 delay-700 ${
          isLoaded ? 'opacity-[0.02]' : 'opacity-0'
        }`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="container mx-auto px-4 pt-20 pb-16 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8 transition-all duration-700 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}>
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
            <span className="text-sm font-medium text-primary">Solusi #1 untuk RT RW Net di Indonesia</span>
          </div>

          {/* Headline */}
          <h1 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold text-foreground mb-6 leading-tight transition-all duration-700 delay-100 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Kelola Jaringan{" "}
            <span className="text-gradient">RT RW Net</span>
            <br />
            Lebih Mudah & Profesional
          </h1>

          {/* Subheadline */}
          <p className={`text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed transition-all duration-700 delay-200 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            Platform all-in-one untuk manajemen pelanggan, billing otomatis, monitoring jaringan, 
            dan laporan keuangan. Cocok untuk ISP lokal, pengelola desa, dan teknisi jaringan.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 transition-all duration-700 delay-300 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <Button variant="hero" size="xl" className="group" asChild>
              <Link 
                to="/register" 
                state={{ 
                  plan: { 
                    id: "8a956a8f-ee32-45cd-9df6-8bf4f2f5f052", 
                    name: "Starter", 
                    isTrial: true 
                  } 
                }}
              >
                Mulai Gratis 7 Hari
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline-hero" size="xl" className="group">
              <Play className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Lihat Demo
            </Button>
          </div>

          {/* Stats */}
          <div className={`grid grid-cols-3 gap-8 max-w-lg mx-auto transition-all duration-700 delay-400 ${
            isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            {[
              { icon: Users, value: "500+", label: "Jaringan Aktif", color: "primary" },
              { icon: Wifi, value: "50K+", label: "Pelanggan Dikelola", color: "accent" },
              { icon: BarChart3, value: "99.9%", label: "Uptime Server", color: "primary" },
            ].map((stat, index) => (
              <div 
                key={stat.label} 
                className={`text-center transition-all duration-500 ${
                  isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                }`}
                style={{ transitionDelay: isLoaded ? `${500 + index * 100}ms` : '0ms' }}
              >
                <div className={`flex items-center justify-center w-12 h-12 ${
                  stat.color === 'primary' ? 'bg-primary/10' : 'bg-accent/10'
                } rounded-xl mx-auto mb-3`}>
                  <stat.icon className={`w-6 h-6 ${
                    stat.color === 'primary' ? 'text-primary' : 'text-accent'
                  }`} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className={`mt-16 max-w-5xl mx-auto transition-all duration-1000 delay-600 ${
          isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'
        }`}>
          <div className="relative">
            {/* Glow effect */}
            <div className={`absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-3xl transition-all duration-1000 delay-800 ${
              isLoaded ? 'opacity-20 scale-100' : 'opacity-0 scale-90'
            }`} />
            
            {/* Dashboard mockup */}
            <div className="relative bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
              {/* Browser header */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-1.5">
                  <div className={`w-3 h-3 rounded-full bg-destructive/60 transition-all duration-300 ${
                    isLoaded ? 'scale-100' : 'scale-0'
                  }`} style={{ transitionDelay: '900ms' }} />
                  <div className={`w-3 h-3 rounded-full bg-accent/60 transition-all duration-300 ${
                    isLoaded ? 'scale-100' : 'scale-0'
                  }`} style={{ transitionDelay: '950ms' }} />
                  <div className={`w-3 h-3 rounded-full bg-primary/60 transition-all duration-300 ${
                    isLoaded ? 'scale-100' : 'scale-0'
                  }`} style={{ transitionDelay: '1000ms' }} />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className={`bg-background rounded-md px-4 py-1 text-xs text-muted-foreground transition-all duration-500 ${
                    isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                  }`} style={{ transitionDelay: '1050ms' }}>
                    app.netmanage.id/dashboard
                  </div>
                </div>
              </div>
              
              {/* Dashboard content placeholder */}
              <div className="p-6 bg-gradient-to-b from-muted/30 to-background">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div 
                      key={i} 
                      className={`bg-card rounded-xl p-4 border border-border shadow-sm transition-all duration-500 ${
                        isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
                      }`}
                      style={{ transitionDelay: isLoaded ? `${1100 + i * 100}ms` : '0ms' }}
                    >
                      <div className="w-8 h-8 bg-primary/10 rounded-lg mb-3" />
                      <div className="h-6 bg-muted rounded w-16 mb-2" />
                      <div className="h-4 bg-muted/50 rounded w-24" />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className={`col-span-2 bg-card rounded-xl p-4 border border-border shadow-sm h-48 transition-all duration-500 ${
                    isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
                  }`} style={{ transitionDelay: '1500ms' }}>
                    <div className="h-4 bg-muted rounded w-32 mb-4" />
                    <div className="flex items-end gap-2 h-32">
                      {[40, 65, 45, 80, 55, 70, 60, 85, 50, 75, 65, 90].map((h, i) => (
                        <div
                          key={i}
                          className={`flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t transition-all duration-700 ${
                            isLoaded ? 'opacity-100' : 'opacity-0'
                          }`}
                          style={{ 
                            height: isLoaded ? `${h}%` : '0%',
                            transitionDelay: isLoaded ? `${1600 + i * 50}ms` : '0ms'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <div className={`bg-card rounded-xl p-4 border border-border shadow-sm transition-all duration-500 ${
                    isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
                  }`} style={{ transitionDelay: '1550ms' }}>
                    <div className="h-4 bg-muted rounded w-24 mb-4" />
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div 
                          key={i} 
                          className={`flex items-center gap-3 transition-all duration-300 ${
                            isLoaded ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                          }`}
                          style={{ transitionDelay: isLoaded ? `${1700 + i * 100}ms` : '0ms' }}
                        >
                          <div className="w-8 h-8 bg-muted rounded-full" />
                          <div className="flex-1">
                            <div className="h-3 bg-muted rounded w-20 mb-1" />
                            <div className="h-2 bg-muted/50 rounded w-16" />
                          </div>
                        </div>
                      ))}
                    </div>
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

export default HeroSection;
