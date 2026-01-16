import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Network, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const planData = location.state?.plan;

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    ispName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Check if already logged in
  useEffect(() => {
    const accessToken = sessionStorage.getItem('access_token');
    if (accessToken) {
      // Already logged in, redirect to dashboard
      navigate('/dashboard');
    }
  }, [navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (formData.ispName.length < 3) {
      errors.push("Nama ISP minimal 3 karakter");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push("Email tidak valid");
    }

    if (!/^08\d{8,11}$/.test(formData.phone)) {
      errors.push("Nomor telepon harus diawali 08 dan 10-13 digit");
    }

    if (formData.password.length < 8) {
      errors.push("Password minimal 8 karakter");
    }

    if (formData.password !== formData.confirmPassword) {
      errors.push("Password tidak cocok");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const errors = validateForm();
    if (errors.length > 0) {
      toast({
        title: "Validasi Gagal",
        description: errors.join(", "),
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      console.log('Plan data:', planData); // Debug log
      console.log('Plan ID being sent:', planData?.id); // Debug log
      
      // Validate plan_id
      if (!planData?.id) {
        toast({
          description: "Plan tidak dipilih. Silakan pilih paket terlebih dahulu.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      const response = await api.signUp({
        isp_name: formData.ispName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        plan_id: planData.id,
        owner_name: formData.ownerName,
        use_trial: planData.isTrial !== false, // Default to trial unless explicitly set to false
      });

      toast({
        description: response.message,
      });

      // Redirect based on trial or paid
      if (response.is_trial) {
        setTimeout(() => {
          // Redirect to dashboard in this app with tenant data
          navigate(`/dashboard?tenant_id=${response.tenant_id}&email=${formData.email}&trial=true&trial_ends=${response.trial_ends}`);
        }, 1500);
      } else if (response.order_id) {
        // Save order_id for payment flow
        localStorage.setItem('pending_order_id', response.order_id);
        
        // Redirect to custom payment page
        setTimeout(() => {
          navigate(`/payment/${response.order_id}`);
        }, 1500);
      } else if (response.payment_url) {
        setTimeout(() => {
          window.location.href = response.payment_url!;
        }, 2000);
      }
    } catch (error: any) {
      console.log('Registration error:', error); // Debug log
      
      // Extract detailed error message from backend response
      let errorMessage = "Terjadi kesalahan. Silakan coba lagi.";
      
      // Try to get the main error message
      if (error.message && error.message !== 'Registration failed') {
        errorMessage = error.message;
      }
      
      // Check if there are detailed error messages in the response
      if (error.details) {
        console.log('Error details:', error.details); // Debug log
        
        // If details is an object with field-specific errors
        if (typeof error.details === 'object') {
          const detailMessages = Object.values(error.details).filter(Boolean);
          if (detailMessages.length > 0) {
            errorMessage = detailMessages.join(". ");
          }
        }
      }
      
      toast({
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 md:p-6">
        <Link
          to="/"
          className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium">Kembali</span>
        </Link>
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
            <Network className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg hidden sm:block">NetManage</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Daftar Sekarang
              </h1>
              <p className="text-muted-foreground text-sm">
                🎉 Mulai free trial 7 hari tanpa kartu kredit
              </p>
              {planData && (
                <div className="mt-4 inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2">
                  <span className="text-sm font-medium text-primary">
                    Paket: {planData.name}
                  </span>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="ispName">
                  Nama ISP *
                </label>
                <Input
                  id="ispName"
                  name="ispName"
                  type="text"
                  placeholder="e.g., My ISP Network"
                  value={formData.ispName}
                  onChange={handleChange}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="ownerName">
                  Nama Pemilik *
                </label>
                <Input
                  id="ownerName"
                  name="ownerName"
                  type="text"
                  placeholder="e.g., John Doe"
                  value={formData.ownerName}
                  onChange={handleChange}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="email">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="owner@myisp.com"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="h-12 bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="phone">
                    Telepon *
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="08123456789"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="h-12 bg-background/50 border-border/50 focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="password">
                    Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Min. 8 karakter"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={8}
                      className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    className="text-sm font-medium"
                    htmlFor="confirmPassword"
                  >
                    Konfirmasi Password *
                  </label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Ulangi password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary text-primary-foreground font-semibold text-base shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Memproses...
                  </span>
                ) : (
                  "Mulai Free Trial 7 Hari"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                Sudah punya akun?{" "}
                <Link
                  to="/login"
                  className="text-primary font-semibold hover:underline"
                >
                  Login di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;
