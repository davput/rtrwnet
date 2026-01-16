import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, Sparkles, Clock, Crown, Rocket } from "lucide-react";

const plans = [
  {
    id: "8a956a8f-ee32-45cd-9df6-8bf4f2f5f052",
    name: "Starter",
    description: "Untuk jaringan kecil",
    price: "99",
    period: "/bulan",
    icon: Rocket,
    hasTrial: true,
    features: [
      "Free trial 7 hari",
      "Maksimal 50 pelanggan",
      "Manajemen pelanggan dasar",
      "Billing & invoice",
      "Notifikasi WhatsApp",
      "Laporan bulanan",
      "Support via chat",
    ],
    cta: "Coba Gratis 7 Hari",
    popular: false,
    color: "accent",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Untuk jaringan berkembang",
    price: "249",
    period: "/bulan",
    icon: Sparkles,
    features: [
      "Maksimal 300 pelanggan",
      "Semua fitur Starter",
      "Integrasi Mikrotik",
      "Monitoring jaringan",
      "Isolir otomatis",
      "Aplikasi mobile",
      "Support prioritas",
    ],
    cta: "Pilih Professional",
    popular: true,
    color: "primary",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Untuk ISP skala besar",
    price: "499",
    period: "/bulan",
    icon: Crown,
    features: [
      "Unlimited pelanggan",
      "Semua fitur Professional",
      "Multi-lokasi/cabang",
      "API integration",
      "Custom branding",
      "Dedicated support",
    ],
    cta: "Pilih Enterprise",
    popular: false,
    color: "accent",
  },
];

const SelectPlan = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selecting, setSelecting] = useState<string | null>(null);

  const handleSelectPlan = async (planId: string) => {
    setSelecting(planId);

    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      const selectedPlan = plans.find((p) => p.id === planId);
      if (!selectedPlan) {
        toast({
          title: "Paket tidak ditemukan",
          description: "Silakan pilih paket lagi.",
          variant: "destructive",
        });
        return;
      }

      // Jika paket memiliki free trial, arahkan ke register
      if (selectedPlan.hasTrial) {
        navigate("/register", {
          state: {
            plan: {
              id: selectedPlan.id,
              name: selectedPlan.name,
              isTrial: true,
            },
          },
        });
        return;
      }

      // Paket berbayar langsung ke payment
      navigate("/payment", {
        state: {
          plan: {
            id: selectedPlan.id,
            name: selectedPlan.name,
            description: selectedPlan.description,
            price: selectedPlan.price,
            period: selectedPlan.period,
            features: selectedPlan.features,
            iconId: selectedPlan.id,
          },
        },
      });
    } finally {
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-6">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pilih Paket Anda</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pilih Paket yang{" "}
            <span className="text-gradient">Sesuai Kebutuhan</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Mulai dengan trial gratis 7 hari atau pilih paket berbayar untuk fitur lengkap
          </p>
        </div>

        {/* Plans Grid - 3 columns for 3 plans */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            const hasTrial = "hasTrial" in plan && plan.hasTrial;
            return (
              <Card
                key={plan.id}
                className={`relative border-2 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col ${
                  plan.popular
                    ? "border-primary shadow-lg"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-primary text-primary-foreground shadow-lg">
                      Paling Populer
                    </Badge>
                  </div>
                )}

                {/* Free Trial badge */}
                {hasTrial && !plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge variant="outline" className="bg-background border-accent text-accent shadow-lg">
                      🎁 Free Trial
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${
                    plan.popular ? "bg-primary/10" : "bg-accent/10"
                  }`}>
                    <IconComponent className={`h-6 w-6 ${
                      plan.popular ? "text-primary" : "text-accent"
                    }`} />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col">
                  {/* Price */}
                  <div className="text-center py-2">
                    <div className="flex items-baseline justify-center gap-1">
                      {plan.price !== "0" && (
                        <span className="text-sm text-muted-foreground">Rp</span>
                      )}
                      <span className="text-3xl font-bold text-foreground">
                        {plan.price === "0" ? "Gratis" : `${plan.price}K`}
                      </span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  {/* Features */}
                  <ul className="space-y-2 flex-1 mb-4">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                          plan.popular ? "bg-primary/20" : "bg-accent/20"
                        }`}>
                          <Check className={`w-2.5 h-2.5 ${
                            plan.popular ? "text-primary" : "text-accent"
                          }`} />
                        </div>
                        <span className="text-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button - Always at bottom */}
                  <Button
                    variant={plan.popular ? "hero" : "outline-hero"}
                    className="w-full mt-auto"
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={selecting !== null}
                  >
                    {selecting === plan.id ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      plan.cta
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Pembayaran aman • Bisa bayar bulanan • Garansi 30 hari uang kembali
          </p>
        </div>
      </div>
    </div>
  );
};

export default SelectPlan;
