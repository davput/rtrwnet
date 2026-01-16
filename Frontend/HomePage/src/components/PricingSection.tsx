import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { Link } from "react-router-dom";

// Static plans data - ID harus sesuai dengan database
const plans = [
  {
    id: "550e8400-e29b-41d4-a716-446655440010", // Standard Plan ID dari database
    name: "Standard Plan",
    slug: "standard",
    description: "Perfect for small ISPs with up to 100 customers",
    price: 299000,
    billing_cycle: "monthly",
    features: [
      "Up to 100 customers",
      "Basic reporting",
      "Email support",
      "Mobile app access"
    ],
    popular: false
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440011", // Premium Plan ID dari database
    name: "Premium Plan",
    slug: "premium",
    description: "For growing ISPs with up to 500 customers",
    price: 599000,
    billing_cycle: "monthly",
    features: [
      "Up to 500 customers",
      "Advanced reporting",
      "Priority support",
      "API access",
      "Custom branding"
    ],
    popular: true
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440012", // Enterprise Plan ID dari database
    name: "Enterprise Plan",
    slug: "enterprise",
    description: "For large ISPs with unlimited customers",
    price: 1499000,
    billing_cycle: "monthly",
    features: [
      "Unlimited customers",
      "Advanced analytics",
      "24/7 support",
      "API access",
      "Custom branding",
      "Dedicated account manager"
    ],
    popular: false
  }
];

const PricingSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: gridRef, isVisible: gridVisible } = useScrollAnimation({ threshold: 0.1 });

  const formatPrice = (price: number) => {
    return (price / 1000).toFixed(0);
  };

  return (
    <section id="pricing" className="py-24 bg-muted/30 relative overflow-hidden">
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
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-primary">Harga Terjangkau</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pilih Paket yang{" "}
            <span className="text-gradient">Sesuai Kebutuhan</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Mulai gratis 14 hari, tanpa kartu kredit. Upgrade kapan saja sesuai pertumbuhan jaringan Anda.
          </p>
        </div>

        {/* Pricing cards */}
        <div ref={gridRef} className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={plan.id}
              className={`relative bg-card rounded-2xl p-8 border transition-all duration-500 hover:shadow-xl hover:-translate-y-2 ${
                plan.popular 
                  ? "border-primary shadow-lg scale-105 md:scale-110" 
                  : "border-border hover:border-primary/30"
              } ${
                gridVisible 
                  ? 'opacity-100 translate-y-0' 
                  : 'opacity-0 translate-y-16'
              }`}
              style={{ 
                transitionDelay: gridVisible ? `${index * 150}ms` : '0ms'
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 transition-all duration-500 ${
                  gridVisible 
                    ? 'opacity-100 scale-100' 
                    : 'opacity-0 scale-75'
                }`} style={{ transitionDelay: gridVisible ? '400ms' : '0ms' }}>
                  <div className="bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                    Paling Populer
                  </div>
                </div>
              )}

              {/* Plan header */}
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-sm text-muted-foreground">Rp</span>
                  <span className={`text-4xl font-extrabold text-foreground transition-all duration-700 ${
                    gridVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
                  }`} style={{ transitionDelay: gridVisible ? `${index * 150 + 200}ms` : '0ms' }}>
                    {formatPrice(plan.price)}K
                  </span>
                  <span className="text-muted-foreground">/{plan.billing_cycle === 'monthly' ? 'bulan' : 'tahun'}</span>
                </div>
              </div>

              {/* Features */}
              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => (
                  <li 
                    key={featureIndex} 
                    className={`flex items-center gap-3 transition-all duration-500 ${
                      gridVisible 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 -translate-x-4'
                    }`}
                    style={{ 
                      transitionDelay: gridVisible ? `${index * 150 + featureIndex * 50 + 300}ms` : '0ms'
                    }}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      plan.popular ? "bg-primary/20" : "bg-accent/20"
                    }`}>
                      <Check className={`w-3 h-3 ${plan.popular ? "text-primary" : "text-accent"}`} />
                    </div>
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button 
                variant={plan.popular ? "hero" : "outline-hero"} 
                size="lg" 
                className={`w-full transition-all duration-500 ${
                  gridVisible 
                    ? 'opacity-100 translate-y-0' 
                    : 'opacity-0 translate-y-4'
                }`}
                style={{ 
                  transitionDelay: gridVisible ? `${index * 150 + 600}ms` : '0ms'
                }}
                asChild
              >
                <Link
                  to="/register"
                  state={{ plan: { id: plan.id, name: plan.name, price: plan.price } }}
                >
                  Coba Gratis 7 Hari
                </Link>
              </Button>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className={`text-center mt-12 transition-all duration-700 ${
          gridVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-4'
        }`} style={{ transitionDelay: gridVisible ? '800ms' : '0ms' }}>
          <p className="text-sm text-muted-foreground mb-4">
            Pembayaran aman • Bisa bayar bulanan • Garansi 30 hari uang kembali
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
