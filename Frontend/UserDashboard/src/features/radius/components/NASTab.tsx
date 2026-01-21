import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { DataTable, Column } from "@/components/shared";
import { useNASList, useCreateNAS, useDeleteNAS } from "@/hooks/useRadius";
import { MikroTikScriptModal } from "./MikroTikScriptModal";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  MoreHorizontal,
  Loader2,
  Server,
  CheckCircle,
  XCircle,
  Terminal,
} from "lucide-react";
import type { RadiusNAS } from "@/types/radius";

export function NASTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scriptModalOpen, setScriptModalOpen] = useState(false);
  const [selectedNAS, setSelectedNAS] = useState<RadiusNAS | null>(null);
  const [nasToDelete, setNasToDelete] = useState<RadiusNAS | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nasname: "",
    shortname: "",
    secret: "",
    description: "",
  });

  const { data, isLoading } = useNASList();
  const createNAS = useCreateNAS();
  const deleteNAS = useDeleteNAS();

  const nasList: RadiusNAS[] = (data as { data?: RadiusNAS[] })?.data || [];

  const handleCreate = async () => {
    if (!formData.shortname.trim()) {
      toast.error("Nama MikroTik wajib diisi");
      return;
    }

    try {
      // Generate random secret if not provided
      const secret = formData.secret || generateRandomSecret();
      
      const newNAS = await createNAS.mutateAsync({
        nasname: formData.nasname || "0.0.0.0",
        shortname: formData.shortname,
        type: "mikrotik",
        secret: secret,
        description: formData.description,
      });

      toast.success("NAS berhasil ditambahkan");
      setDialogOpen(false);
      
      // Open script modal with the new NAS
      setSelectedNAS(newNAS as unknown as RadiusNAS);
      setScriptModalOpen(true);
      
      // Reset form
      setFormData({
        nasname: "",
        shortname: "",
        secret: "",
        description: "",
      });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Gagal menambahkan NAS");
    }
  };

  const handleShowScript = (nas: RadiusNAS) => {
    setSelectedNAS(nas);
    setScriptModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!nasToDelete) return;
    try {
      await deleteNAS.mutateAsync(nasToDelete.id);
      toast.success("NAS berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus NAS");
    } finally {
      setNasToDelete(null);
    }
  };

  const generateRandomSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 16; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return secret;
  };

  const columns: Column<RadiusNAS>[] = [
    {
      key: "shortname",
      header: "Nama MikroTik",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{row.shortname}</span>
        </div>
      ),
      sortable: true,
    },
    {
      key: "nasname",
      header: "IP Address",
      cell: (row) => (
        <span className="font-mono text-sm">
          {row.nasname === "0.0.0.0" || row.nasname === "pending" ? (
            <Badge variant="outline" className="text-yellow-600">
              Belum terhubung
            </Badge>
          ) : (
            row.nasname
          )}
        </span>
      ),
      sortable: true,
    },
    {
      key: "description",
      header: "Keterangan",
      cell: (row) => (
        <span className="text-muted-foreground">{row.description || "-"}</span>
      ),
    },
    {
      key: "is_active",
      header: "Status",
      cell: (row) => (
        <Badge
          className={
            row.is_active
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }
        >
          {row.is_active ? (
            <CheckCircle className="mr-1 h-3 w-3" />
          ) : (
            <XCircle className="mr-1 h-3 w-3" />
          )}
          {row.is_active ? "Aktif" : "Nonaktif"}
        </Badge>
      ),
      sortable: true,
    },
    {
      key: "actions",
      header: "Aksi",
      className: "w-[80px]",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleShowScript(row)}>
              <Terminal className="mr-2 h-4 w-4" />
              Lihat Setup Script
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setNasToDelete(row)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">MikroTik Router</h2>
          <p className="text-sm text-muted-foreground">
            Daftarkan MikroTik untuk integrasi RADIUS
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah MikroTik
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah MikroTik Baru</DialogTitle>
              <DialogDescription>
                Daftarkan MikroTik router Anda. Setelah ditambahkan, sistem akan
                generate script setup otomatis dengan VPN + RADIUS.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="shortname">Nama MikroTik *</Label>
                <Input
                  id="shortname"
                  value={formData.shortname}
                  onChange={(e) => setFormData({ ...formData, shortname: e.target.value })}
                  placeholder="Contoh: MikroTik-Kantor, Router-RT01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="nasname">IP Address (Opsional)</Label>
                <Input
                  id="nasname"
                  value={formData.nasname}
                  onChange={(e) => setFormData({ ...formData, nasname: e.target.value })}
                  placeholder="0.0.0.0 (akan terdeteksi otomatis via VPN)"
                />
                <p className="text-xs text-muted-foreground">
                  Kosongkan jika menggunakan VPN (recommended)
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="secret">RADIUS Secret (Opsional)</Label>
                <Input
                  id="secret"
                  value={formData.secret}
                  onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                  placeholder="Auto-generate jika kosong"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Keterangan</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Lokasi atau keterangan lainnya"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={createNAS.isPending}>
                {createNAS.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Tambah & Generate Script
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={nasList}
        columns={columns}
        searchable
        searchPlaceholder="Cari MikroTik..."
        searchKeys={["shortname", "nasname"]}
        pagination
        pageSize={10}
        loading={isLoading}
        emptyMessage="Belum ada MikroTik terdaftar"
      />

      {/* MikroTik Script Modal */}
      {selectedNAS && (
        <MikroTikScriptModal
          open={scriptModalOpen}
          onOpenChange={setScriptModalOpen}
          nasId={selectedNAS.id}
          nasName={selectedNAS.shortname}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!nasToDelete}
        onOpenChange={() => setNasToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus MikroTik</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus "{nasToDelete?.shortname}"?
              MikroTik tidak akan bisa terkoneksi ke RADIUS lagi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
