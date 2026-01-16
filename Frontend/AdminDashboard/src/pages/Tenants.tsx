import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import {
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Pause,
  Play,
  Trash2,
  Building2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Tenant, TenantStatus, CreateTenantRequest } from "@/types";
import {
  useTenants,
  useCreateTenant,
  useUpdateTenant,
  useDeleteTenant,
  useSuspendTenant,
  useActivateTenant,
  usePlans,
} from "@/hooks/useAdmin";

const statusColors: Record<TenantStatus, string> = {
  active: "bg-green-100 text-green-800",
  suspended: "bg-red-100 text-red-800",
  trial: "bg-yellow-100 text-yellow-800",
  expired: "bg-gray-100 text-gray-800",
};

const statusLabels: Record<TenantStatus, string> = {
  active: "Aktif",
  suspended: "Suspend",
  trial: "Trial",
  expired: "Expired",
};

export function Tenants() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Dialogs
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  // Form state
  const [formData, setFormData] = useState<CreateTenantRequest>({
    name: "",
    slug: "",
    email: "",
    phone: "",
    address: "",
    plan_id: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
  });

  // API hooks
  const { data: tenantsData, isLoading } = useTenants({
    page,
    per_page: perPage,
    search: search || undefined,
    status: statusFilter !== "all" ? (statusFilter as TenantStatus) : undefined,
  });
  const { data: plansData } = usePlans();
  const createTenant = useCreateTenant();
  const deleteTenant = useDeleteTenant();
  const suspendTenant = useSuspendTenant();
  const activateTenant = useActivateTenant();

  const tenants = tenantsData?.data?.tenants || [];
  const total = tenantsData?.data?.total || 0;
  const totalPages = Math.ceil(total / perPage);
  const plans = plansData?.data || [];

  const handleCreateTenant = async () => {
    if (!formData.name || !formData.email || !formData.plan_id || !formData.admin_email || !formData.admin_password) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }

    try {
      await createTenant.mutateAsync(formData);
      toast.success("Tenant berhasil dibuat");
      setCreateDialogOpen(false);
      setFormData({
        name: "", slug: "", email: "", phone: "", address: "",
        plan_id: "", admin_name: "", admin_email: "", admin_password: "",
      });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal membuat tenant");
    }
  };

  const handleSuspendTenant = async () => {
    if (!selectedTenant || !suspendReason) return;

    try {
      await suspendTenant.mutateAsync({ id: selectedTenant.id, reason: suspendReason });
      toast.success("Tenant berhasil di-suspend");
      setSuspendDialogOpen(false);
      setSelectedTenant(null);
      setSuspendReason("");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal suspend tenant");
    }
  };

  const handleActivateTenant = async (tenant: Tenant) => {
    try {
      await activateTenant.mutateAsync(tenant.id);
      toast.success("Tenant berhasil diaktifkan");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal mengaktifkan tenant");
    }
  };

  const handleDeleteTenant = async () => {
    if (!selectedTenant) return;

    try {
      await deleteTenant.mutateAsync(selectedTenant.id);
      toast.success("Tenant berhasil dihapus");
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus tenant");
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground">Kelola semua tenant RT/RW Net</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Tenant
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Daftar Tenant</CardTitle>
              <CardDescription>Total {total} tenant terdaftar</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cari tenant..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="suspended">Suspend</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Pelanggan</TableHead>
                  <TableHead>Pendapatan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terdaftar</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada tenant ditemukan
                    </TableCell>
                  </TableRow>
                ) : (
                  tenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <Building2 className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tenant.plan_name || "No Plan"}</Badge>
                      </TableCell>
                      <TableCell>{tenant.customer_count || 0}</TableCell>
                      <TableCell>{formatCurrency(tenant.monthly_revenue || 0)}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[tenant.status as TenantStatus] || "bg-gray-100"}>
                          {statusLabels[tenant.status as TenantStatus] || tenant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(tenant.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Aksi</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => navigate(`/tenants/${tenant.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {tenant.status === "active" || tenant.status === "trial" ? (
                              <DropdownMenuItem
                                className="text-yellow-600"
                                onClick={() => { setSelectedTenant(tenant); setSuspendDialogOpen(true); }}
                              >
                                <Pause className="mr-2 h-4 w-4" />
                                Suspend
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                className="text-green-600"
                                onClick={() => handleActivateTenant(tenant)}
                              >
                                <Play className="mr-2 h-4 w-4" />
                                Aktifkan
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => { setSelectedTenant(tenant); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between px-2 py-4">
            <p className="text-sm text-muted-foreground">
              Menampilkan {((page - 1) * perPage) + 1}-{Math.min(page * perPage, total)} dari {total} tenant
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">Halaman {page} dari {totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Tenant Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah Tenant Baru</DialogTitle>
            <DialogDescription>Buat tenant baru untuk RT/RW Net</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tenant *</Label>
                <Input
                  id="name"
                  placeholder="RT Net Cempaka"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="rtnet-cempaka"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@rtnet.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telepon</Label>
                <Input
                  id="phone"
                  placeholder="081234567890"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Alamat</Label>
              <Input
                id="address"
                placeholder="Jl. Contoh No. 10, Jakarta"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Paket Langganan *</Label>
              <Select value={formData.plan_id} onValueChange={(v) => setFormData({ ...formData, plan_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih paket" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - {formatCurrency(plan.price)}/{plan.billing_cycle === "monthly" ? "bulan" : "tahun"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Admin Tenant</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="admin_name">Nama Admin *</Label>
                  <Input
                    id="admin_name"
                    placeholder="John Doe"
                    value={formData.admin_name}
                    onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin_email">Email Admin *</Label>
                  <Input
                    id="admin_email"
                    type="email"
                    placeholder="john@rtnet.com"
                    value={formData.admin_email}
                    onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="admin_password">Password *</Label>
                <Input
                  id="admin_password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.admin_password}
                  onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Batal</Button>
            <Button onClick={handleCreateTenant} disabled={createTenant.isPending}>
              {createTenant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Buat Tenant
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend Dialog */}
      <Dialog open={suspendDialogOpen} onOpenChange={setSuspendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suspend Tenant</DialogTitle>
            <DialogDescription>
              Tenant "{selectedTenant?.name}" akan di-suspend. Masukkan alasan suspend.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Alasan Suspend *</Label>
              <Textarea
                id="reason"
                placeholder="Masukkan alasan suspend..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendDialogOpen(false)}>Batal</Button>
            <Button variant="destructive" onClick={handleSuspendTenant} disabled={suspendTenant.isPending || !suspendReason}>
              {suspendTenant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              Tenant "{selectedTenant?.name}" akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTenant} className="bg-destructive text-destructive-foreground">
              {deleteTenant.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
