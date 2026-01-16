import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, Users, CreditCard, Package, AlertTriangle, CheckCircle, XCircle, Pause, Play, Trash2, Edit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useState } from "react";
import * as adminApi from "@/api/admin.api";
import type { Tenant, TenantStatus } from "@/types";

const statusConfig: Record<TenantStatus, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: React.ReactNode }> = {
  active: { label: "Aktif", variant: "default", icon: <CheckCircle className="h-4 w-4" /> },
  suspended: { label: "Ditangguhkan", variant: "destructive", icon: <Pause className="h-4 w-4" /> },
  trial: { label: "Trial", variant: "secondary", icon: <AlertTriangle className="h-4 w-4" /> },
  expired: { label: "Kadaluarsa", variant: "outline", icon: <XCircle className="h-4 w-4" /> },
};

export function TenantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [suspendReason, setSuspendReason] = useState("");
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: tenantData, isLoading, error } = useQuery({
    queryKey: ["tenant", id],
    queryFn: () => adminApi.getTenant(id!),
    enabled: !!id,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => adminApi.suspendTenant(id, reason),
    onSuccess: () => {
      toast.success("Tenant berhasil ditangguhkan");
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
      setShowSuspendDialog(false);
      setSuspendReason("");
    },
    onError: () => toast.error("Gagal menangguhkan tenant"),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => adminApi.activateTenant(id),
    onSuccess: () => {
      toast.success("Tenant berhasil diaktifkan");
      queryClient.invalidateQueries({ queryKey: ["tenant", id] });
    },
    onError: () => toast.error("Gagal mengaktifkan tenant"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteTenant(id),
    onSuccess: () => {
      toast.success("Tenant berhasil dihapus");
      navigate("/tenants");
    },
    onError: () => toast.error("Gagal menghapus tenant"),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !tenantData?.data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <XCircle className="h-12 w-12 text-destructive" />
        <p className="text-muted-foreground">Tenant tidak ditemukan</p>
        <Button variant="outline" onClick={() => navigate("/tenants")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
      </div>
    );
  }

  const tenant = tenantData.data;
  const status = statusConfig[tenant.status] || statusConfig.active;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/tenants")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{tenant.name}</h1>
            <p className="text-muted-foreground">{tenant.slug}</p>
          </div>
          <Badge variant={status.variant} className="flex items-center gap-1">
            {status.icon}
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          {tenant.status === "suspended" ? (
            <Button variant="outline" onClick={() => activateMutation.mutate(tenant.id)} disabled={activateMutation.isPending}>
              <Play className="h-4 w-4 mr-2" />
              Aktifkan
            </Button>
          ) : tenant.status === "active" && (
            <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Pause className="h-4 w-4 mr-2" />
                  Tangguhkan
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tangguhkan Tenant</DialogTitle>
                  <DialogDescription>
                    Tenant yang ditangguhkan tidak dapat mengakses layanan. Masukkan alasan penangguhan.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Alasan Penangguhan</Label>
                    <Textarea
                      placeholder="Masukkan alasan..."
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowSuspendDialog(false)}>Batal</Button>
                  <Button
                    variant="destructive"
                    onClick={() => suspendMutation.mutate({ id: tenant.id, reason: suspendReason })}
                    disabled={!suspendReason || suspendMutation.isPending}
                  >
                    Tangguhkan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Hapus Tenant</DialogTitle>
                <DialogDescription>
                  Apakah Anda yakin ingin menghapus tenant "{tenant.name}"? Tindakan ini tidak dapat dibatalkan dan semua data akan hilang.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Batal</Button>
                <Button
                  variant="destructive"
                  onClick={() => deleteMutation.mutate(tenant.id)}
                  disabled={deleteMutation.isPending}
                >
                  Hapus Permanen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pelanggan</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.customer_count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendapatan Bulanan</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(tenant.monthly_revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paket Langganan</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenant.plan_name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bergabung</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatDate(tenant.created_at)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informasi</TabsTrigger>
          <TabsTrigger value="subscription">Langganan</TabsTrigger>
          <TabsTrigger value="activity">Aktivitas</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Tenant</CardTitle>
              <CardDescription>Detail informasi kontak dan alamat tenant</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nama Bisnis</Label>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tenant.name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tenant.email}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Telepon</Label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tenant.phone || "-"}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Alamat</Label>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tenant.address || "-"}</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">ID Tenant</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{tenant.id}</code>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Slug</Label>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{tenant.slug}</code>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Dibuat</Label>
                  <span className="text-sm">{formatDate(tenant.created_at)}</span>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Diperbarui</Label>
                  <span className="text-sm">{formatDate(tenant.updated_at)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detail Langganan</CardTitle>
              <CardDescription>Informasi paket dan status langganan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Paket Saat Ini</Label>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{tenant.plan_name}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant={status.variant} className="flex items-center gap-1 w-fit">
                    {status.icon}
                    {status.label}
                  </Badge>
                </div>
                {tenant.expires_at && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Berakhir Pada</Label>
                    <span className="font-medium">{formatDate(tenant.expires_at)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>Log aktivitas tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Belum ada aktivitas tercatat
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TenantDetail;
