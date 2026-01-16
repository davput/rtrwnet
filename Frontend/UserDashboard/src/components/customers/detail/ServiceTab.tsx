import { useState } from "react";
import type { Customer } from "@/features/customers/customer.types";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PlayCircle,
  PauseCircle,
  Key,
  XCircle,
  Zap,
  Server,
  CheckCircle2,
} from "lucide-react";
import { customerApi } from "@/features/customers/customer.api";
import { useServicePlans } from "@/features/service-plans/service-plan.store";
import { useToast } from "@/hooks/use-toast";

interface ServiceTabProps {
  customer: Customer;
  onDataChange?: () => void;
}

export function CustomerServiceTab({
  customer,
  onDataChange,
}: ServiceTabProps) {
  const { toast } = useToast();
  const { plans } = useServicePlans();

  const [isActivateDialogOpen, setIsActivateDialogOpen] = useState(false);
  const [isSuspendDialogOpen, setIsSuspendDialogOpen] = useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] = useState(false);
  const [isPPPoEDialogOpen, setIsPPPoEDialogOpen] = useState(false);
  const [isChangePlanDialogOpen, setIsChangePlanDialogOpen] = useState(false);

  const [pppoeData, setPppoeData] = useState({
    username:
      customer?.pppoe_username ||
      `${customer?.customer_code || "user"}@rtrwnet.id`,
    password: generatePassword(),
  });

  const [suspendReason, setSuspendReason] = useState("");
  const [terminateReason, setTerminateReason] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState(
    customer?.service_plan_id || ""
  );

  const [isProcessing, setIsProcessing] = useState(false);

  function generatePassword() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  const handleActivate = async () => {
    setIsProcessing(true);
    try {
      await customerApi.activateCustomer(customer.id);

      toast({
        title: "Customer Diaktifkan",
        description: `${customer?.name || "Customer"} berhasil diaktifkan. Status: Active`,
      });
      setIsActivateDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error("Activate error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengaktifkan customer",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSuspend = async () => {
    setIsProcessing(true);
    try {
      await customerApi.suspendCustomer(customer.id, suspendReason);

      toast({
        title: "Customer Disuspend",
        description: `${customer?.name || "Customer"} telah disuspend`,
        variant: "destructive",
      });
      setIsSuspendDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error("Suspend error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Gagal suspend customer",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUnsuspend = async () => {
    setIsProcessing(true);
    try {
      await customerApi.activateCustomer(customer.id);

      toast({
        title: "Customer Diaktifkan Kembali",
        description: `${customer?.name || "Customer"} berhasil diaktifkan kembali`,
      });
      onDataChange?.();
    } catch (error) {
      console.error("Unsuspend error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengaktifkan kembali customer",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTerminate = async () => {
    setIsProcessing(true);
    try {
      await customerApi.terminateCustomer(customer.id, terminateReason);

      toast({
        title: "Layanan Dihentikan",
        description: `Layanan ${customer?.name || "Customer"} telah dihentikan`,
        variant: "destructive",
      });
      setIsTerminateDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error("Terminate error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal menghentikan layanan",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSavePPPoE = async () => {
    setIsProcessing(true);
    try {
      await customerApi.updateCustomer(customer.id, {
        pppoe_username: pppoeData.username,
        pppoe_password: pppoeData.password,
      });

      toast({
        title: "PPPoE Credentials Disimpan",
        description: "Username dan password PPPoE berhasil disimpan",
      });
      setIsPPPoEDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error("Save PPPoE error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal menyimpan PPPoE credentials",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangePlan = async () => {
    if (!selectedPlanId) return;

    setIsProcessing(true);
    try {
      await customerApi.updateCustomer(customer.id, {
        service_plan_id: selectedPlanId,
      });

      toast({
        title: "Paket Layanan Diubah",
        description: "Paket layanan berhasil diperbarui",
      });
      setIsChangePlanDialogOpen(false);
      onDataChange?.();
    } catch (error) {
      console.error("Change plan error:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Gagal mengubah paket layanan",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: "default" | "secondary" | "destructive" | "outline";
        label: string;
        icon: typeof CheckCircle2;
      }
    > = {
      active: { variant: "default", label: "Aktif", icon: CheckCircle2 },
      pending_activation: {
        variant: "secondary",
        label: "Menunggu Aktivasi",
        icon: Zap,
      },
      suspended: {
        variant: "destructive",
        label: "Disuspend",
        icon: PauseCircle,
      },
      terminated: { variant: "outline", label: "Dihentikan", icon: XCircle },
    };

    const config = variants[status] || variants.pending_activation;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const currentPlan = plans.find((p) => p.id === customer?.service_plan_id);

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Status Layanan</CardTitle>
              <CardDescription>
                Status dan informasi layanan customer
              </CardDescription>
            </div>
            {getStatusBadge(customer?.status || "pending_activation")}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label className="text-muted-foreground">Paket Layanan</Label>
              <p className="text-lg font-semibold">
                {currentPlan?.name ||
                  customer?.service_plan?.name ||
                  "Belum dipilih"}
              </p>
              {(currentPlan || customer?.service_plan) && (
                <p className="text-sm text-muted-foreground">
                  {currentPlan?.speed_download ||
                    customer?.service_plan?.speed_download ||
                    0}{" "}
                  Mbps /{" "}
                  {currentPlan?.speed_upload ||
                    customer?.service_plan?.speed_upload ||
                    0}{" "}
                  Mbps
                </p>
              )}
            </div>

            <div>
              <Label className="text-muted-foreground">Biaya Bulanan</Label>
              <p className="text-lg font-semibold">
                Rp {customer.monthly_fee?.toLocaleString("id-ID") || 0}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Tanggal Aktivasi</Label>
              <p className="text-lg font-semibold">
                {customer.installation_date
                  ? new Date(customer.installation_date).toLocaleDateString(
                      "id-ID"
                    )
                  : "-"}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Jatuh Tempo</Label>
              <p className="text-lg font-semibold">
                Tanggal {customer.due_date || "-"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            {customer?.status === "pending_activation" && (
              <Button
                onClick={() => setIsActivateDialogOpen(true)}
                disabled={isProcessing}
              >
                <PlayCircle className="mr-2 h-4 w-4" />
                Aktivasi Layanan
              </Button>
            )}

            {customer?.status === "active" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setIsSuspendDialogOpen(true)}
                  disabled={isProcessing}
                >
                  <PauseCircle className="mr-2 h-4 w-4" />
                  Suspend Layanan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsChangePlanDialogOpen(true)}
                  disabled={isProcessing}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Ubah Paket
                </Button>
              </>
            )}

            {customer?.status === "suspended" && (
              <Button onClick={handleUnsuspend} disabled={isProcessing}>
                <PlayCircle className="mr-2 h-4 w-4" />
                {isProcessing ? "Processing..." : "Aktifkan Kembali"}
              </Button>
            )}

            {customer?.status !== "terminated" && (
              <Button
                variant="outline"
                className="text-red-600"
                onClick={() => setIsTerminateDialogOpen(true)}
                disabled={isProcessing}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Hentikan Layanan
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* PPPoE Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                PPPoE Credentials
              </CardTitle>
              <CardDescription>
                Username dan password untuk koneksi internet
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPPPoEDialogOpen(true)}
            >
              {customer.pppoe_username ? "Edit" : "Generate"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <Label className="text-muted-foreground">Username</Label>
              <p className="text-lg font-mono">
                {customer.pppoe_username || (
                  <span className="text-muted-foreground">Belum dibuat</span>
                )}
              </p>
            </div>

            <div>
              <Label className="text-muted-foreground">Password</Label>
              <p className="text-lg font-mono">
                {customer.pppoe_password || (
                  <span className="text-muted-foreground">Belum dibuat</span>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Status Koneksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label className="text-muted-foreground">Status</Label>
              <div className="mt-1">
                <Badge variant={customer.is_online ? "default" : "secondary"}>
                  {customer.is_online ? "Online" : "Offline"}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-muted-foreground">IP Address</Label>
              <p className="text-lg font-mono">{customer.ip_address || "-"}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Terakhir Online</Label>
              <p className="text-sm">
                {customer.last_seen
                  ? new Date(customer.last_seen).toLocaleString("id-ID")
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activate Dialog */}
      <AlertDialog
        open={isActivateDialogOpen}
        onOpenChange={setIsActivateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aktivasi Layanan Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin mengaktifkan layanan untuk{" "}
              {customer?.name || "customer ini"}?
              <br />
              <br />
              Pastikan:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>PPPoE credentials sudah dibuat</li>
                <li>Paket layanan sudah dipilih</li>
                <li>Data pelanggan sudah lengkap</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Ya, Aktivasi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend Dialog */}
      <AlertDialog
        open={isSuspendDialogOpen}
        onOpenChange={setIsSuspendDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Layanan</AlertDialogTitle>
            <AlertDialogDescription>
              Layanan customer akan disuspend dan tidak bisa mengakses internet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="suspend-reason">Alasan Suspend</Label>
            <Textarea
              id="suspend-reason"
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              placeholder="Contoh: Tunggakan pembayaran 2 bulan"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleSuspend} disabled={isProcessing}>
              {isProcessing ? "Processing..." : "Ya, Suspend"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Terminate Dialog */}
      <AlertDialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hentikan Layanan</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600">
              PERHATIAN: Tindakan ini akan menghentikan layanan secara permanen!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="terminate-reason">Alasan Penghentian</Label>
            <Textarea
              id="terminate-reason"
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              placeholder="Contoh: Customer pindah rumah"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminate}
              disabled={isProcessing}
              className="bg-red-600"
            >
              {isProcessing ? "Processing..." : "Ya, Hentikan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PPPoE Dialog */}
      <Dialog open={isPPPoEDialogOpen} onOpenChange={setIsPPPoEDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PPPoE Credentials</DialogTitle>
            <DialogDescription>
              Generate atau edit username dan password untuk koneksi internet
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="pppoe-username">Username *</Label>
              <Input
                id="pppoe-username"
                value={pppoeData.username}
                onChange={(e) =>
                  setPppoeData({ ...pppoeData, username: e.target.value })
                }
                className="mt-2 font-mono"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="pppoe-password">Password *</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPppoeData({ ...pppoeData, password: generatePassword() })
                  }
                >
                  Generate Baru
                </Button>
              </div>
              <Input
                id="pppoe-password"
                value={pppoeData.password}
                onChange={(e) =>
                  setPppoeData({ ...pppoeData, password: e.target.value })
                }
                className="mt-2 font-mono"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Password akan disimpan dan bisa dilihat kapan saja
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsPPPoEDialogOpen(false)}
            >
              Batal
            </Button>
            <Button onClick={handleSavePPPoE} disabled={isProcessing}>
              {isProcessing ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Plan Dialog */}
      <Dialog
        open={isChangePlanDialogOpen}
        onOpenChange={setIsChangePlanDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Paket Layanan</DialogTitle>
            <DialogDescription>
              Pilih paket layanan baru untuk customer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Paket Saat Ini</Label>
              <p className="text-lg font-semibold mt-1">
                {currentPlan?.name || customer?.service_plan?.name || "-"} - Rp{" "}
                {(
                  currentPlan?.price ||
                  customer?.service_plan?.price ||
                  0
                ).toLocaleString("id-ID")}
              </p>
            </div>

            <div>
              <Label htmlFor="new-plan">Paket Baru *</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Pilih paket baru" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {plan.speed_download || 0} Mbps - Rp{" "}
                      {(plan.price || 0).toLocaleString("id-ID")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangePlanDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleChangePlan}
              disabled={isProcessing || !selectedPlanId}
            >
              {isProcessing ? "Mengubah..." : "Ubah Paket"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
