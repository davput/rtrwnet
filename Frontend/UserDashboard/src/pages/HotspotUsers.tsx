import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { DataTable, Column } from "@/components/shared";
import { Users, UserPlus, Search, Trash2, RefreshCw, Eye, Copy, Ticket } from "lucide-react";
import { hotspotPackageApi, hotspotVoucherApi } from "@/api/hotspot.api";
import { customerHotspotApi } from "@/api/customers.api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export default function HotspotUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState<any>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // Form state - Manual User
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPackageId, setFormPackageId] = useState("");

  // Form state - Generate Voucher
  const [voucherPackageId, setVoucherPackageId] = useState("");
  const [voucherQuantity, setVoucherQuantity] = useState("1");
  const [voucherPrefix, setVoucherPrefix] = useState("");

  // Fetch vouchers
  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ["hotspot-vouchers"],
    queryFn: () => hotspotVoucherApi.list(),
  });

  const vouchers = vouchersData?.data || [];

  // Fetch packages
  const { data: packages = [] } = useQuery({
    queryKey: ["hotspot-packages"],
    queryFn: () => hotspotPackageApi.list(),
  });

  // Add manual user mutation
  const addManualUserMutation = useMutation({
    mutationFn: async () => {
      return await hotspotVoucherApi.generate({
        package_id: formPackageId,
        quantity: 1,
        prefix: formUsername,
      });
    },
    onSuccess: () => {
      toast({ title: "Berhasil", description: "User manual berhasil ditambahkan" });
      setShowAddDialog(false);
      resetManualForm();
      queryClient.invalidateQueries({ queryKey: ["hotspot-vouchers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menambahkan user", variant: "destructive" });
    },
  });

  // Generate voucher mutation
  const generateVoucherMutation = useMutation({
    mutationFn: async () => {
      return await hotspotVoucherApi.generate({
        package_id: voucherPackageId,
        quantity: parseInt(voucherQuantity),
        prefix: voucherPrefix || undefined,
      });
    },
    onSuccess: (data) => {
      toast({ 
        title: "Berhasil", 
        description: `${data.length} voucher berhasil di-generate` 
      });
      setShowAddDialog(false);
      resetVoucherForm();
      queryClient.invalidateQueries({ queryKey: ["hotspot-vouchers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal generate voucher", variant: "destructive" });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => hotspotVoucherApi.delete(id),
    onSuccess: () => {
      toast({ title: "Berhasil", description: "User/Voucher berhasil dihapus" });
      setShowDeleteDialog(false);
      setSelectedVoucher(null);
      queryClient.invalidateQueries({ queryKey: ["hotspot-vouchers"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Gagal menghapus", variant: "destructive" });
    },
  });

  const resetManualForm = () => {
    setFormUsername("");
    setFormPassword("");
    setFormPackageId("");
  };

  const resetVoucherForm = () => {
    setVoucherPackageId("");
    setVoucherQuantity("1");
    setVoucherPrefix("");
  };

  const handleAddManualUser = () => {
    if (!formUsername || !formPackageId) {
      toast({ title: "Error", description: "Username dan paket wajib diisi", variant: "destructive" });
      return;
    }
    addManualUserMutation.mutate();
  };

  const handleGenerateVoucher = () => {
    if (!voucherPackageId || !voucherQuantity) {
      toast({ title: "Error", description: "Paket dan jumlah wajib diisi", variant: "destructive" });
      return;
    }
    generateVoucherMutation.mutate();
  };

  const handleDelete = () => {
    if (selectedVoucher) {
      deleteMutation.mutate(selectedVoucher.id);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Tersalin", description: `${label} berhasil disalin` });
  };

  const columns: Column<any>[] = [
    {
      key: "voucher_code",
      header: "Username/Kode",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium">{row.voucher_code}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => copyToClipboard(row.voucher_code, "Username")}
          >
            <Copy className="h-3 w-3" />
          </Button>
        </div>
      ),
      sortable: true,
    },
    {
      key: "package_name",
      header: "Paket",
      cell: (row) => row.package_name || "-",
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => (
        <Badge
          variant={
            row.status === "active"
              ? "default"
              : row.status === "expired"
              ? "destructive"
              : row.status === "unused"
              ? "secondary"
              : "outline"
          }
        >
          {row.status === "active" ? "Aktif" : 
           row.status === "expired" ? "Expired" : 
           row.status === "unused" ? "Belum Dipakai" : 
           "Terpakai"}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "activated_at",
      header: "Aktivasi",
      cell: (row) => row.activated_at ? new Date(row.activated_at).toLocaleDateString("id-ID") : "-",
      sortable: true,
    },
    {
      key: "expires_at",
      header: "Expired",
      cell: (row) => row.expires_at ? new Date(row.expires_at).toLocaleDateString("id-ID") : "-",
      sortable: true,
    },
    {
      key: "created_at",
      header: "Dibuat",
      cell: (row) => new Date(row.created_at).toLocaleDateString("id-ID"),
      sortable: true,
    },
    {
      key: "actions",
      header: "Aksi",
      cell: (row) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVoucher(row);
              setShowPasswordDialog(true);
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSelectedVoucher(row);
              setShowDeleteDialog(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      ),
    },
  ];

  const filteredVouchers = vouchers.filter((voucher: any) =>
    voucher.voucher_code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Management User Hotspot</h1>
          <p className="text-sm text-muted-foreground">
            Kelola user hotspot dengan manual atau generate voucher
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Tambah User / Voucher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Daftar User & Voucher Hotspot
              </CardTitle>
              <CardDescription>Total {filteredVouchers.length} user/voucher</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari username/kode..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => queryClient.invalidateQueries({ queryKey: ["hotspot-vouchers"] })}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            data={filteredVouchers}
            columns={columns}
            loading={isLoading}
            emptyMessage="Belum ada user/voucher hotspot"
            pagination
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Add User/Voucher Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tambah User / Generate Voucher</DialogTitle>
            <DialogDescription>
              Pilih mode: Tambah user manual atau generate voucher massal
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="manual" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manual">
                <UserPlus className="mr-2 h-4 w-4" />
                User Manual
              </TabsTrigger>
              <TabsTrigger value="voucher">
                <Ticket className="mr-2 h-4 w-4" />
                Generate Voucher
              </TabsTrigger>
            </TabsList>

            {/* Manual User Tab */}
            <TabsContent value="manual" className="space-y-4">
              <div className="space-y-2">
                <Label>Username *</Label>
                <Input
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="username_customer"
                />
                <p className="text-xs text-muted-foreground">
                  Username akan digunakan sebagai prefix voucher
                </p>
              </div>
              <div className="space-y-2">
                <Label>Paket *</Label>
                <Select value={formPackageId} onValueChange={setFormPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.duration} {pkg.duration_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button 
                  onClick={handleAddManualUser}
                  disabled={addManualUserMutation.isPending}
                >
                  {addManualUserMutation.isPending ? "Menambahkan..." : "Tambah User"}
                </Button>
              </div>
            </TabsContent>

            {/* Generate Voucher Tab */}
            <TabsContent value="voucher" className="space-y-4">
              <div className="space-y-2">
                <Label>Paket *</Label>
                <Select value={voucherPackageId} onValueChange={setVoucherPackageId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - Rp {pkg.price.toLocaleString("id-ID")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Jumlah Voucher *</Label>
                <Input
                  type="number"
                  value={voucherQuantity}
                  onChange={(e) => setVoucherQuantity(e.target.value)}
                  placeholder="10"
                  min="1"
                  max="100"
                />
                <p className="text-xs text-muted-foreground">
                  Maksimal 100 voucher per generate
                </p>
              </div>
              <div className="space-y-2">
                <Label>Prefix (Opsional)</Label>
                <Input
                  value={voucherPrefix}
                  onChange={(e) => setVoucherPrefix(e.target.value)}
                  placeholder="VCH"
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground">
                  Prefix akan ditambahkan di awal kode voucher
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Batal
                </Button>
                <Button 
                  onClick={handleGenerateVoucher}
                  disabled={generateVoucherMutation.isPending}
                >
                  {generateVoucherMutation.isPending ? "Generating..." : "Generate Voucher"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* View Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credentials Hotspot</DialogTitle>
            <DialogDescription>
              Informasi login untuk user hotspot
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="flex gap-2">
                <Input value={selectedVoucher?.voucher_code || ""} readOnly className="font-mono" />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(selectedVoucher?.voucher_code || "", "Username")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <Input 
                  value={selectedVoucher?.voucher_password || "••••••••••••"} 
                  readOnly 
                  className="font-mono" 
                  type="password"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => copyToClipboard(selectedVoucher?.voucher_password || "", "Password")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Status: <strong>{selectedVoucher?.status}</strong>
                {selectedVoucher?.expires_at && (
                  <span className="block mt-1">
                    Expired: {new Date(selectedVoucher.expires_at).toLocaleString("id-ID")}
                  </span>
                )}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPasswordDialog(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User/Voucher?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus "{selectedVoucher?.voucher_code}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
