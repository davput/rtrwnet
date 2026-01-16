import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Network, Mail, RefreshCw } from "lucide-react";

const VerifyEmail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Get email from navigation state or use placeholder
  const email = location.state?.email || "user@example.com";

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newCode = [...code];
    
    // Handle paste
    if (value.length > 1) {
      const pastedCode = value.slice(0, 6).split("");
      pastedCode.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      // Focus last filled input or next empty
      const nextIndex = Math.min(index + pastedCode.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const verificationCode = code.join("");
    
    if (verificationCode.length !== 6) {
      toast({
        title: "Error",
        description: "Masukkan 6 digit kode verifikasi",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Dummy verification - accept any 6-digit code
    toast({
      title: "Email Terverifikasi!",
      description: "Akun Anda berhasil diverifikasi. Silakan login.",
    });

    navigate("/login");
    setIsLoading(false);
  };

  const handleResend = async () => {
    setIsResending(true);
    
    // Simulate resend delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast({
      title: "Kode Terkirim!",
      description: "Kode verifikasi baru telah dikirim ke email Anda.",
    });

    setCountdown(60);
    setIsResending(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link to="/register" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
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
        <div className="w-full max-w-md">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl animate-fade-in">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Verifikasi Email</h1>
              <p className="text-muted-foreground text-sm">
                Kami telah mengirim kode verifikasi ke
              </p>
              <p className="text-primary font-medium mt-1">{email}</p>
            </div>

            {/* Code Input */}
            <div className="flex justify-center gap-2 md:gap-3 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-14 md:w-12 md:h-16 text-center text-xl md:text-2xl font-bold bg-background/50 border-2 border-border/50 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              ))}
            </div>

            {/* Verify Button */}
            <Button
              onClick={handleVerify}
              disabled={isLoading || code.join("").length !== 6}
              className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 mb-4"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memverifikasi...
                </span>
              ) : (
                "Verifikasi"
              )}
            </Button>

            {/* Resend Code */}
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Tidak menerima kode?
              </p>
              {countdown > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Kirim ulang dalam <span className="text-primary font-medium">{countdown}s</span>
                </p>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResend}
                  disabled={isResending}
                  className="text-primary hover:text-primary/80"
                >
                  {isResending ? (
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Kirim Ulang Kode
                </Button>
              )}
            </div>

            {/* Info */}
            <div className="mt-6 pt-6 border-t border-border/50">
              <p className="text-xs text-muted-foreground text-center">
                Pastikan untuk memeriksa folder spam jika tidak menemukan email.
                Kode berlaku selama 10 menit.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default VerifyEmail;
