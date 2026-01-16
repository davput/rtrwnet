import { type ComponentType, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  CreditCard,
  Building2,
  Wallet,
  Shield,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Sparkles,
  Rocket,
  Crown,
} from "lucide-react";

const paymentMethods = [
  {
    id: "bank_transfer",
    name: "Transfer Bank",
    description: "BCA, Mandiri, BNI, BRI",
    icon: Building2,
  },
  {
    id: "virtual_account",
    name: "Virtual Account",
    description: "Pembayaran otomatis terverifikasi",
    icon: CreditCard,
  },
  {
    id: "ewallet",
    name: "E-Wallet",
    description: "GoPay, OVO, DANA, ShopeePay",
    icon: Wallet,
  },
];

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const plan = location.state?.plan as
    | {
        id: string;
        name: string;
        description: string;
        price: string;
        period: string;
        features: string[];
        iconId: string;
      }
    | undefined;

  const PlanIcon = useMemo(() => {
    const iconMap: Record<string, ComponentType<{ className?: string }>> = {
      starter: Rocket,
      professional: Sparkles,
      enterprise: Crown,
      trial: Clock,
    };

    return iconMap[plan?.iconId ?? ""] ?? CreditCard;
  }, [plan?.iconId]);

  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Redirect if no plan selected
  if (!plan) {
    return <Navigate to="/select-plan" replace />;
  }

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast({
        title: "Persetujuan Diperlukan",
        description: "Anda harus menyetujui syarat dan ketentuan untuk melanjutkan.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Pembayaran Berhasil!",
        description: `Selamat! Anda telah berlangganan paket ${plan.name}.`,
      });

      // Navigate to login for new users or dashboard for authenticated users
      navigate("/login", { 
        state: { 
          message: "Pembayaran berhasil! Silakan login untuk mengakses akun Anda.",
          planPurchased: plan.name 
        } 
      });
    } catch (error) {
      toast({
        title: "Pembayaran Gagal",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6 text-muted-foreground hover:text-foreground"
          onClick={() => navigate("/select-plan")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali ke Pilihan Paket
        </Button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-4">
            <CreditCard className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Pembayaran Aman</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Selesaikan <span className="text-gradient">Pembayaran</span>
          </h1>
          <p className="text-muted-foreground">
            Pilih metode pembayaran yang paling nyaman untuk Anda
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Payment Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Payment Method Selection */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Metode Pembayaran
                </CardTitle>
                <CardDescription>
                  Pilih cara pembayaran yang Anda inginkan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  className="space-y-3"
                >
                  {paymentMethods.map((method) => {
                    const IconComponent = method.icon;
                    return (
                      <div
                        key={method.id}
                        className={`flex items-center space-x-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          paymentMethod === method.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50"
                        }`}
                        onClick={() => setPaymentMethod(method.id)}
                      >
                        <RadioGroupItem value={method.id} id={method.id} />
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={method.id}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {method.name}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {method.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Informasi Penagihan
                </CardTitle>
                <CardDescription>
                  Data ini akan digunakan untuk invoice
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Nama Lengkap</Label>
                    <Input id="fullName" placeholder="Masukkan nama lengkap" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="email@example.com" />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input id="phone" placeholder="08xxxxxxxxxx" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Nama Perusahaan (Opsional)</Label>
                    <Input id="company" placeholder="Nama perusahaan" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat</Label>
                  <Input id="address" placeholder="Alamat lengkap" />
                </div>
              </CardContent>
            </Card>

            {/* Terms Agreement */}
            <Card className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={agreedToTerms}
                    onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                  />
                  <div className="space-y-1">
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      Saya menyetujui{" "}
                      <Link
                        to="/terms-of-service"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Syarat dan Ketentuan
                      </Link>{" "}
                      serta{" "}
                      <Link
                        to="/terms-of-service"
                        className="text-primary hover:underline"
                        target="_blank"
                      >
                        Kebijakan Privasi
                      </Link>
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dengan melakukan pembayaran, Anda menyetujui untuk berlangganan layanan kami.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="border-2 border-primary/20 sticky top-6">
              <CardHeader className="bg-primary/5 rounded-t-lg">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Ringkasan Pesanan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Plan Info */}
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <PlanIcon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{plan.name}</p>
                      <p className="text-xs text-muted-foreground">{plan.description}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Paket {plan.name}</span>
                    <span className="text-foreground">Rp {plan.price}K</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Periode</span>
                    <span className="text-foreground">1 Bulan</span>
                  </div>
                </div>

                <Separator />

                {/* Total */}
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total</span>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">Rp {plan.price}K</p>
                    <p className="text-xs text-muted-foreground">/bulan</p>
                  </div>
                </div>

                {/* Pay Button */}
                <Button
                  variant="hero"
                  className="w-full"
                  size="lg"
                  onClick={handlePayment}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memproses...
                    </>
                  ) : (
                    <>
                      <Shield className="h-4 w-4 mr-2" />
                      Bayar Sekarang
                    </>
                  )}
                </Button>

                {/* Security Note */}
                <div className="flex items-center gap-2 p-3 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  <p className="text-xs text-muted-foreground">
                    Pembayaran Anda dilindungi dengan enkripsi SSL 256-bit
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Yang Anda Dapatkan:
                  </p>
                  {plan.features.slice(0, 4).map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                  {plan.features.length > 4 && (
                    <p className="text-xs text-primary">
                      +{plan.features.length - 4} fitur lainnya
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span>Pembayaran Aman</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Aktivasi Instan</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>Garansi 30 Hari</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
