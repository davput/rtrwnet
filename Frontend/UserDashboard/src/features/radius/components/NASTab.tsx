import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { apiClient } from "@/services/api/client";
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
  Copy,
  Terminal,
  Check,
} from "lucide-react";
import type { RadiusNAS } from "@/types/radius";

export function NASTab() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scriptDialogOpen, setScriptDialogOpen] = useState(false);
  const [generatedScript, setGeneratedScript] = useState("");
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [copied, setCopied] = useState(false);
  const [nasToDelete, setNasToDelete] = useState<RadiusNAS | null>(null);
  const [generating, setGenerating] = useState(false);

  // Form state - hanya nama MikroTik
  const [nasName, setNasName] = useState("");

  const { data, isLoading } = useNASList();
  const createNAS = useCreateNAS();
  const deleteNAS = useDeleteNAS();

  const nasList: RadiusNAS[] = (data as { data?: RadiusNAS[] })?.data || [];

  const handleCreate = async () => {
    if (!nasName.trim()) {
      toast.error("Nama MikroTik wajib diisi");
      return;
    }

    setGenerating(true);

    try {
      // Call backend to generate script
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const scriptRes = await apiClient.post("/radius/generate-script", {
        nas_name: nasName,
      }) as any;

      const script = scriptRes.data?.data?.script || "";
      const secret = scriptRes.data?.data?.secret || "";

      // Save NAS to database
      await createNAS.mutateAsync({
        nasname: "pending",
        shortname: nasName,
        type: "mikrotik",
        secret: secret,
        description: `Auto-generated for ${nasName}`,
      });

      setGeneratedScript(script);
      setGeneratedSecret(secret);
      setDialogOpen(false);
      setScriptDialogOpen(true);

      toast.success("NAS berhasil ditambahkan");
      setNasName("");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || "Gagal generate script");
    } finally {
      setGenerating(false);
    }
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

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(generatedScript);
      setCopied(true);
      toast.success("Script berhasil disalin!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin script");
    }
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
          {row.nasname === "pending" ? (
            <Badge variant="outline" className="text-yellow-600">
              Menunggu koneksi...
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
                Masukkan nama MikroTik, sistem akan generate script konfigurasi
                otomatis untuk koneksi ke server
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nasName">Nama MikroTik *</Label>
                <Input
                  id="nasName"
                  value={nasName}
                  onChange={(e) => setNasName(e.target.value)}
                  placeholder="Contoh: MikroTik-Kantor, Router-RT01"
                />
                <p className="text-xs text-muted-foreground">
                  Nama unik untuk identifikasi router MikroTik Anda
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={generating || createNAS.isPending}>
                {(generating || createNAS.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Terminal className="mr-2 h-4 w-4" />
                Generate Script
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

      {/* Script Dialog */}
      <Dialog open={scriptDialogOpen} onOpenChange={setScriptDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Script Konfigurasi MikroTik
            </DialogTitle>
            <DialogDescription>
              Copy script di bawah ini dan paste ke Terminal MikroTik Anda
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Textarea
              value={generatedScript}
              readOnly
              className="font-mono text-xs h-[400px] bg-zinc-950 text-green-400 border-zinc-800"
            />
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-2 right-2"
              onClick={handleCopyScript}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Tersalin!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Script
                </>
              )}
            </Button>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              <strong>Cara penggunaan:</strong>
              <br />
              1. Buka Winbox → Terminal
              <br />
              2. Copy semua script di atas (Ctrl+A, Ctrl+C)
              <br />
              3. Klik kanan di Terminal MikroTik → Paste
              <br />
              4. Tunggu hingga selesai
              <br />
              5. Verifikasi dengan: <code>/interface ovpn-client print</code>
            </p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <strong>Catatan:</strong> Pastikan OpenVPN server sudah berjalan di VPS 
              dan port 1194 UDP terbuka di firewall.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setScriptDialogOpen(false)}>Selesai</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
