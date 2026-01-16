import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Network, Eye, EyeOff } from "lucide-react";
import { api } from "@/lib/api";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
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
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = await api.simpleLogin(formData.username, formData.password);

      // Store tokens and user info
      sessionStorage.setItem('access_token', data.access_token);
      sessionStorage.setItem('refresh_token', data.refresh_token);
      sessionStorage.setItem('tenant_id', data.user.tenant_id);
      sessionStorage.setItem('user_email', data.user.email);
      sessionStorage.setItem('user_name', data.user.name);

      toast({
        description: "Login berhasil! Mengalihkan ke dashboard...",
      });

      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);
    } catch (error: any) {
      toast({
        description: error.message || "Periksa username dan password Anda",
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
        <Link to="/" className="flex items-center gap-2 text-foreground hover:text-primary transition-colors group">
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
        <div className="w-full max-w-md">
          <div className="bg-card/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-border/50 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">Login ke Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                Masuk dengan email Anda
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="username">
                  Email
                </label>
                <Input
                  id="username"
                  name="username"
                  type="email"
                  placeholder="admin@isp.com"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  className="h-12 bg-background/50 border-border/50 focus:border-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="h-12 bg-background/50 border-border/50 focus:border-primary pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
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
                  "Login"
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-border/50 text-center">
              <p className="text-sm text-muted-foreground">
                Belum punya akun?{" "}
                <Link to="/register" className="text-primary font-semibold hover:underline">
                  Daftar di sini
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;
