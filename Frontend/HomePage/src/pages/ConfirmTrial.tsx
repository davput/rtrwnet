import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Network, 
  Clock, 
  Check, 
  Sparkles,
  Shield,
  CreditCard,
  Calendar
} from "lucide-react";

const ConfirmTrial = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  const trialBenefits = [
    { icon: Sparkles, text: "Akses penuh semua fitur premium" },
    { icon: Clock, text: "Trial selama 7 hari" },
    { icon: CreditCard, text: "Tanpa kartu kredit" },
    { icon: Calendar, text: "Batalkan kapan saja" },
  ];

  const handleStartTrial = async () => {
    if (!acceptTerms) {
      toast({
        title: "Persetujuan Diperlukan",
        description: "Anda harus menyetujui Syarat dan Ketentuan untuk melanjutkan",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Trial Aktif! 🎉",
      description: "Selamat! Trial 7 hari Anda sudah aktif. Selamat mencoba!",
    });

    navigate("/dashboard");
    setIsLoading(false);
  };

  // Calculate trial end date
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7);
  const formattedEndDate = trialEndDate.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link to="/select-plan" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
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

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl animate-fade-in">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                <Clock className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Konfirmasi Free Trial</h1>
              <p className="text-muted-foreground">
                Anda akan memulai trial gratis selama 7 hari
              </p>
            </div>

            {/* Trial Info Card */}
            <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Paket</span>
                <span className="font-semibold text-primary">Free Trial</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Durasi</span>
                <span className="font-semibold">7 Hari</span>
              </div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-muted-foreground">Harga</span>
                <span className="font-semibold text-green-500">Gratis</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-primary/20">
                <span className="text-sm text-muted-foreground">Berakhir pada</span>
                <span className="font-semibold text-sm">{formattedEndDate}</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3 mb-6">
              <p className="text-sm font-medium text-foreground">Yang Anda dapatkan:</p>
              {trialBenefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <benefit.icon className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm text-foreground">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 mb-6 p-4 bg-background/50 rounded-xl border border-border/50">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="mt-0.5"
              />
              <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer">
                Saya telah membaca dan menyetujui{" "}
                <Link to="/terms-of-service" className="text-primary hover:underline font-medium">
                  Syarat dan Ketentuan
                </Link>{" "}
                yang berlaku
              </label>
            </div>

            {/* CTA Button */}
            <Button
              onClick={handleStartTrial}
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Mengaktifkan Trial...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  Mulai Trial Gratis Sekarang
                </span>
              )}
            </Button>

            {/* Security Note */}
            <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              <span>Data Anda aman dan terlindungi</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ConfirmTrial;
