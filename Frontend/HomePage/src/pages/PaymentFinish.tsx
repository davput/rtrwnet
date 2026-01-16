import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
  Home,
  RefreshCw,
} from "lucide-react";

type PaymentStatus = "loading" | "success" | "pending" | "failed";

const PaymentFinish = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<PaymentStatus>("loading");

  const orderId = searchParams.get("order_id");
  const transactionStatus = searchParams.get("transaction_status");
  const statusCode = searchParams.get("status_code");

  useEffect(() => {
    // Determine payment status from Midtrans callback params
    if (transactionStatus === "settlement" || transactionStatus === "capture") {
      setStatus("success");
    } else if (transactionStatus === "pending") {
      setStatus("pending");
    } else if (
      transactionStatus === "deny" ||
      transactionStatus === "cancel" ||
      transactionStatus === "expire"
    ) {
      setStatus("failed");
    } else if (statusCode === "200" || statusCode === "201") {
      setStatus("success");
    } else {
      // Default to pending if no clear status
      setStatus("pending");
    }
  }, [transactionStatus, statusCode]);

  const renderContent = () => {
    switch (status) {
      case "loading":
        return (
          <Card className="border-2 max-w-md mx-auto">
            <CardContent className="pt-12 pb-12 text-center">
              <Loader2 className="h-16 w-16 text-primary mx-auto mb-4 animate-spin" />
              <h2 className="text-xl font-semibold mb-2">Memproses Pembayaran...</h2>
              <p className="text-muted-foreground">
                Mohon tunggu sebentar
              </p>
            </CardContent>
          </Card>
        );

      case "success":
        return (
          <Card className="border-2 border-green-500/20 max-w-md mx-auto">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-600">
                Pembayaran Berhasil!
              </CardTitle>
              <CardDescription>
                Terima kasih! Akun Anda telah aktif.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono font-semibold">{orderId}</p>
                </div>
              )}
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => navigate("/login")}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Login ke Dashboard
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Beranda
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "pending":
        return (
          <Card className="border-2 border-yellow-500/20 max-w-md mx-auto">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                <Clock className="h-10 w-10 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl text-yellow-600">
                Menunggu Pembayaran
              </CardTitle>
              <CardDescription>
                Pembayaran Anda sedang diproses atau menunggu konfirmasi.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono font-semibold">{orderId}</p>
                </div>
              )}
              <div className="bg-yellow-500/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Jika Anda sudah melakukan pembayaran, akun akan otomatis aktif
                  dalam beberapa menit. Silakan cek email untuk konfirmasi.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Status
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Beranda
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "failed":
        return (
          <Card className="border-2 border-red-500/20 max-w-md mx-auto">
            <CardHeader className="text-center pb-2">
              <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-600">
                Pembayaran Gagal
              </CardTitle>
              <CardDescription>
                Maaf, pembayaran Anda tidak dapat diproses.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderId && (
                <div className="bg-muted/50 rounded-lg p-4 text-center">
                  <p className="text-sm text-muted-foreground mb-1">Order ID</p>
                  <p className="font-mono font-semibold">{orderId}</p>
                </div>
              )}
              <div className="bg-red-500/10 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Pembayaran dibatalkan atau kadaluarsa. Silakan coba lagi
                  atau hubungi customer support jika masalah berlanjut.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  className="w-full"
                  onClick={() => navigate("/select-plan")}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Coba Lagi
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate("/")}
                >
                  <Home className="h-4 w-4 mr-2" />
                  Kembali ke Beranda
                </Button>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero py-12 px-4 flex items-center justify-center">
      <div className="container mx-auto max-w-4xl">
        {renderContent()}
      </div>
    </div>
  );
};

export default PaymentFinish;
