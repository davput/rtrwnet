import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Building2,
  Wallet,
  QrCode,
  Copy,
  CheckCircle2,
  Clock,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8089/api/v1";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  bank?: string;
  description: string;
  icon: string;
}

interface PaymentInfo {
  bank?: string;
  va_number?: string;
  biller_code?: string;
  bill_key?: string;
  qr_url?: string;
  qr_string?: string;
  deeplink?: string;
}

interface PaymentResponse {
  order_id: string;
  payment_type: string;
  transaction_status: string;
  gross_amount: number;
  expiry_time: string;
  payment_info: PaymentInfo;
}

const PaymentCustom = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Fetch payment methods
  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch(`${API_URL}/public/payment-methods`);
      const data = await response.json();
      if (data.success) {
        setPaymentMethods(data.data.payment_methods);
      }
    } catch (error) {
      console.error("Failed to fetch payment methods:", error);
    }
  };

  const createPayment = async () => {
    if (!selectedMethod || !orderId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/public/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          payment_method: selectedMethod,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPaymentData(data.data);
        setPaymentCreated(true);
        toast({
          title: "Pembayaran Dibuat",
          description: "Silakan selesaikan pembayaran sesuai instruksi.",
        });
      } else {
        toast({
          title: "Gagal",
          description: data.message || "Gagal membuat pembayaran",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Terjadi kesalahan. Silakan coba lagi.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!orderId) return;

    setCheckingStatus(true);
    try {
      const response = await fetch(`${API_URL}/public/payments/${orderId}/status`);
      const data = await response.json();
      
      if (data.success) {
        if (data.data.transaction_status === "paid") {
          toast({
            title: "Pembayaran Berhasil!",
            description: "Akun Anda telah aktif.",
          });
          navigate("/payment/finish?transaction_status=settlement&order_id=" + orderId);
        } else {
          toast({
            title: "Status: " + data.data.transaction_status,
            description: "Pembayaran belum diterima. Silakan selesaikan pembayaran.",
          });
        }
      }
    } catch (error) {
      console.error("Failed to check status:", error);
    } finally {
      setCheckingStatus(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ description: "Disalin ke clipboard" });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case "bank_transfer":
      case "echannel":
        return Building2;
      case "gopay":
      case "shopeepay":
        return Wallet;
      case "qris":
        return QrCode;
      default:
        return Wallet;
    }
  };

  const groupedMethods = paymentMethods.reduce((acc, method) => {
    const group = method.type === "bank_transfer" || method.type === "echannel" 
      ? "bank" 
      : "ewallet";
    if (!acc[group]) acc[group] = [];
    acc[group].push(method);
    return acc;
  }, {} as Record<string, PaymentMethod[]>);


  // Render payment instructions after payment is created
  if (paymentCreated && paymentData) {
    return (
      <div className="min-h-screen bg-gradient-hero py-12 px-4">
        <div className="container mx-auto max-w-lg">
          <Card className="border-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <CardTitle>Menunggu Pembayaran</CardTitle>
              <CardDescription>
                Selesaikan pembayaran sebelum {paymentData.expiry_time}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Info */}
              <div className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground mb-1">Total Pembayaran</p>
                <p className="text-2xl font-bold text-primary">
                  Rp {paymentData.gross_amount.toLocaleString("id-ID")}
                </p>
              </div>

              <Separator />

              {/* Payment Instructions based on type */}
              {paymentData.payment_info.va_number && (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Nomor Virtual Account</p>
                  <div className="flex items-center gap-2 bg-muted rounded-lg p-3">
                    <span className="font-mono text-lg flex-1">
                      {paymentData.payment_info.va_number}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.payment_info.va_number!)}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Bank: {paymentData.payment_info.bank?.toUpperCase()}
                  </p>
                </div>
              )}

              {paymentData.payment_info.biller_code && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Kode Biller</p>
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-3 mt-1">
                      <span className="font-mono text-lg flex-1">
                        {paymentData.payment_info.biller_code}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentData.payment_info.biller_code!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Kode Pembayaran</p>
                    <div className="flex items-center gap-2 bg-muted rounded-lg p-3 mt-1">
                      <span className="font-mono text-lg flex-1">
                        {paymentData.payment_info.bill_key}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentData.payment_info.bill_key!)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {paymentData.payment_info.qr_url && (
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium">Scan QR Code</p>
                  <img
                    src={paymentData.payment_info.qr_url}
                    alt="QR Code"
                    className="mx-auto w-48 h-48 rounded-lg border"
                  />
                  {paymentData.payment_info.deeplink && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => window.location.href = paymentData.payment_info.deeplink!}
                    >
                      Buka Aplikasi
                    </Button>
                  )}
                </div>
              )}

              {paymentData.payment_info.qr_string && !paymentData.payment_info.qr_url && (
                <div className="text-center space-y-3">
                  <p className="text-sm font-medium">QRIS</p>
                  <div className="bg-muted rounded-lg p-4">
                    <p className="text-xs text-muted-foreground break-all font-mono">
                      {paymentData.payment_info.qr_string}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Scan dengan aplikasi e-wallet atau mobile banking
                  </p>
                </div>
              )}

              <Separator />

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={checkPaymentStatus}
                  disabled={checkingStatus}
                >
                  {checkingStatus ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Memeriksa...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Cek Status Pembayaran
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  Kembali ke Beranda
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render payment method selection
  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <Card className="border-2">
          <CardHeader className="text-center">
            <CardTitle>Pilih Metode Pembayaran</CardTitle>
            <CardDescription>
              Order ID: {orderId}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Bank Transfer */}
            {groupedMethods.bank && groupedMethods.bank.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Transfer Bank / Virtual Account
                </h3>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  <div className="grid gap-2">
                    {groupedMethods.bank.map((method) => {
                      const Icon = getMethodIcon(method.type);
                      return (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={method.id} className="cursor-pointer font-medium">
                              {method.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
            )}

            {/* E-Wallet */}
            {groupedMethods.ewallet && groupedMethods.ewallet.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  E-Wallet & QRIS
                </h3>
                <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
                  <div className="grid gap-2">
                    {groupedMethods.ewallet.map((method) => {
                      const Icon = getMethodIcon(method.type);
                      return (
                        <div
                          key={method.id}
                          className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedMethod === method.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={() => setSelectedMethod(method.id)}
                        >
                          <RadioGroupItem value={method.id} id={method.id} />
                          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <Label htmlFor={method.id} className="cursor-pointer font-medium">
                              {method.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{method.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </RadioGroup>
              </div>
            )}

            <Separator />

            <Button
              className="w-full"
              size="lg"
              onClick={createPayment}
              disabled={!selectedMethod || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Lanjutkan Pembayaran"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentCustom;
