import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Edit, Trash2, Users, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { AdminUser } from "@/types";
import { useAdmins, useCreateAdmin, useUpdateAdmin, useDeleteAdmin } from "@/hooks/useAdmin";

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
};

const roleColors: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-800",
  admin: "bg-blue-100 text-blue-800",
  support: "bg-green-100 text-green-800",
};

interface AdminFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  is_active: boolean;
}

export function AdminUsers() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editAdmin, setEditAdmin] = useState<AdminUser | null>(null);
  const [deleteAdminId, setDeleteAdminId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const [formData, setFormData] = useState<AdminFormData>({
    name: "",
    email: "",
    password: "",
    role: "admin",
    is_active: true,
  });

  // API hooks
  const { data: adminsData, isLoading } = useAdmins({ page, per_page: 20 });
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const deleteAdmin = useDeleteAdmin();

  const admins = adminsData?.data?.admins || [];
  const total = adminsData?.data?.total || 0;

  const resetForm = () => {
    setFormData({ name: "", email: "", password: "", role: "admin", is_active: true });
    setEditAdmin(null);
    setCreateDialogOpen(false);
  };

  const openEditDialog = (admin: AdminUser) => {
    setEditAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      role: admin.role,
      is_active: admin.is_active,
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || (!editAdmin && !formData.password)) {
      toast.error("Lengkapi semua field yang wajib");
      return;
    }

    try {
      if (editAdmin) {
        const updateData: Partial<AdminFormData> = {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          is_active: formData.is_active,
        };
        if (formData.password) updateData.password = formData.password;
        await updateAdmin.mutateAsync({ id: editAdmin.id, data: updateData });
        toast.success("Admin berhasil diperbarui");
      } else {
        await createAdmin.mutateAsync(formData);
        toast.success("Admin berhasil dibuat");
      }
      resetForm();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menyimpan admin");
    }
  };

  const handleDelete = async () => {
    if (!deleteAdminId) return;

    try {
      await deleteAdmin.mutateAsync(deleteAdminId);
      toast.success("Admin berhasil dihapus");
      setDeleteAdminId(null);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Gagal menghapus admin");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
            <p className="text-muted-foreground">Kelola pengguna admin sistem</p>
          </div>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">Kelola pengguna admin sistem</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Admin
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Daftar Admin
          </CardTitle>
          <CardDescription>Total {total} admin terdaftar</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Belum ada admin
                  </TableCell>
                </TableRow>
              ) : (
                admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {admin.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{admin.name}</p>
                          <p className="text-sm text-muted-foreground">{admin.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={roleColors[admin.role] || "bg-gray-100"}>
                        {roleLabels[admin.role] || admin.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={admin.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                        {admin.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                    </TableCell>
                    <TableCell>{admin.last_login ? formatDate(admin.last_login) : "-"}</TableCell>
                    <TableCell>{formatDate(admin.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(admin)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleteAdminId(admin.id)}>
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
        </CardContent>
      </Card>

      {/* Create/Edit Admin Dialog */}
      <Dialog open={createDialogOpen || !!editAdmin} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAdmin ? "Edit Admin" : "Tambah Admin Baru"}</DialogTitle>
            <DialogDescription>
              {editAdmin ? "Perbarui informasi admin" : "Buat akun admin baru untuk sistem"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama *</Label>
              <Input
                id="name"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@rtwnet.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password {editAdmin ? "(kosongkan jika tidak diubah)" : "*"}</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={formData.role} onValueChange={(v) => setFormData({ ...formData, role: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label htmlFor="is_active">Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Batal</Button>
            <Button onClick={handleSubmit} disabled={createAdmin.isPending || updateAdmin.isPending}>
              {(createAdmin.isPending || updateAdmin.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editAdmin ? "Simpan" : "Buat Admin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAdminId} onOpenChange={(open) => !open && setDeleteAdminId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Admin ini akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {deleteAdmin.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
