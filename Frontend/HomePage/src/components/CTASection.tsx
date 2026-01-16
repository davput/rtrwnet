import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-primary opacity-5" />
      <div className={`absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl transition-all duration-1000 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`} />
      <div className={`absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl transition-all duration-1000 delay-300 ${
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`} />

      <div ref={ref} className="container mx-auto px-4 relative">
        <div className="max-w-3xl mx-auto text-center">
          {/* Content */}
          <h2 className={`text-3xl md:text-5xl font-bold text-foreground mb-6 transition-all duration-700 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Siap Kelola Jaringan{" "}
            <span className="text-gradient">Lebih Profesional?</span>
          </h2>
          <p className={`text-lg md:text-xl text-muted-foreground mb-10 transition-all duration-700 delay-100 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Gabung dengan 500+ pemilik RT RW Net yang sudah menggunakan NetManage. 
            Coba gratis 14 hari, tanpa perlu kartu kredit.
          </p>

          {/* CTA Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 mb-8 transition-all duration-700 delay-200 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            <Button variant="hero" size="xl" className="group" asChild>
              <Link 
                to="/register" 
                state={{ plan: { id: "starter", name: "Starter", isTrial: true } }}
              >
                Mulai Gratis Sekarang
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline-hero" size="xl" className="group">
              <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Chat dengan Tim Kami
            </Button>
          </div>

          {/* Trust text */}
          <p className={`text-sm text-muted-foreground transition-all duration-700 delay-300 ${
            isVisible 
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-10'
          }`}>
            Setup dalam 5 menit • Tanpa kontrak • Batal kapan saja
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
