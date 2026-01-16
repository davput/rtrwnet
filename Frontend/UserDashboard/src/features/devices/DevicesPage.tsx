import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  useDevices,
  useCreateDevice,
  useDeleteDevice,
  useTestConnection,
} from "@/hooks/useDevices";
import { toast } from "sonner";
import {
  Plus,
  Trash2,
  Edit,
  Wifi,
  WifiOff,
  Loader2,
  Router,
  RefreshCw,
  MoreHorizontal,
  Wrench,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import type { DeviceType, DeviceStatus, CreateDeviceRequest } from "@/types/device";

interface DeviceRow {
  id: string;
  name: string;
  device_type: DeviceType;
  ip_address: string;
  status: DeviceStatus;
  last_seen?: string;
}

const statusConfig: Record<DeviceStatus, { label: string; className: string }> = {
  online: { label: "Online", className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" },
  offline: { label: "Offline", className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" },
  maintenance: { label: "Maintenance", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" },
};

const deviceTypeLabels: Record<DeviceType, string> = {
  mikrotik: "MikroTik",
  olt: "OLT",
  switch: "Switch",
  router: "Router",
  ont: "ONT",
};

export function DevicesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deviceToDelete, setDeviceToDelete] = useState<DeviceRow | null>(null);
  const [formData, setFormData] = useState<CreateDeviceRequest>({
    name: "",
    device_type: "mikrotik",
    ip_address: "",
    username: "",
    password: "",
    port: 8728,
  });

  const { data, isLoading } = useDevices({ page: 1, per_page: 100 });
  const createDevice = useCreateDevice();
  const deleteDevice = useDeleteDevice();
  const testConnection = useTestConnection();

  const devices: DeviceRow[] = data?.data?.devices || [];

  const handleCreate = async () => {
    try {
      await createDevice.mutateAsync(formData);
      toast.success("Perangkat berhasil ditambahkan");
      setDialogOpen(false);
      setFormData({
        name: "",
        device_type: "mikrotik",
        ip_address: "",
        username: "",
        password: "",
        port: 8728,
      });
    } catch {
      toast.error("Gagal menambahkan perangkat");
    }
  };

  const confirmDelete = async () => {
    if (!deviceToDelete) return;
    try {
      await deleteDevice.mutateAsync(deviceToDelete.id);
      toast.success("Perangkat berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus perangkat");
    } finally {
      setDeviceToDelete(null);
    }
  };

  const handleTestConnection = async (id: string) => {
    try {
      const result = await testConnection.mutateAsync(id);
      if (result.data?.success) {
        toast.success("Koneksi berhasil");
      } else {
        toast.error("Koneksi gagal");
      }
    } catch {
      toast.error("Gagal menguji koneksi");
    }
  };

  const columns: Column<DeviceRow>[] = [
    {
      key: "name",
      header: "Nama",
      cell: (row) => <span className="font-medium">{row.name}</span>,
      sortable: true,
    },
    {
      key: "device_type",
      header: "Tipe",
      cell: (row) => deviceTypeLabels[row.device_type],
      sortable: true,
    },
    {
      key: "ip_address",
      header: "IP Address",
      cell: (row) => <span className="font-mono text-sm">{row.ip_address}</span>,
      sortable: true,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => {
        const config = statusConfig[row.status];
        return (
          <Badge className={config.className}>
            {row.status === "online" ? (
              <Wifi className="mr-1 h-3 w-3" />
            ) : row.status === "maintenance" ? (
              <Wrench className="mr-1 h-3 w-3" />
            ) : (
              <WifiOff className="mr-1 h-3 w-3" />
            )}
            {config.label}
          </Badge>
        );
      },
      sortable: true,
    },
    {
      key: "last_seen",
      header: "Terakhir Online",
      cell: (row) =>
        row.last_seen
          ? format(new Date(row.last_seen), "d MMM yyyy HH:mm", { locale: id })
          : "-",
      sortable: true,
    },
    {
      key: "actions",
      header: "Aksi",
      className: "w-[80px]",
      cell: (row) => (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {row.device_type === "mikrotik" && (
                <DropdownMenuItem
                  onClick={() => handleTestConnection(row.id)}
                  disabled={testConnection.isPending}
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${testConnection.isPending ? "animate-spin" : ""}`} />
                  Test Koneksi
                </DropdownMenuItem>
              )}
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600"
                onClick={() => setDeviceToDelete(row)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Router className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Perangkat Jaringan</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Perangkat
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Perangkat Baru</DialogTitle>
              <DialogDescription>Masukkan informasi perangkat</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="MikroTik-01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="device_type">Tipe</Label>
                  <Select
                    value={formData.device_type}
                    onValueChange={(value) =>
                      setFormData({ ...formData, device_type: value as DeviceType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mikrotik">MikroTik</SelectItem>
                      <SelectItem value="olt">OLT</SelectItem>
                      <SelectItem value="switch">Switch</SelectItem>
                      <SelectItem value="router">Router</SelectItem>
                      <SelectItem value="ont">ONT</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ip_address">IP Address</Label>
                  <Input
                    id="ip_address"
                    value={formData.ip_address}
                    onChange={(e) => setFormData({ ...formData, ip_address: e.target.value })}
                    placeholder="192.168.1.1"
                  />
                </div>
              </div>
              {formData.device_type === "mikrotik" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="admin"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="port">API Port</Label>
                    <Input
                      id="port"
                      type="number"
                      value={formData.port}
                      onChange={(e) =>
                        setFormData({ ...formData, port: parseInt(e.target.value) || 8728 })
                      }
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={createDevice.isPending}>
                {createDevice.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={devices}
        columns={columns}
        title="Daftar Perangkat"
        description={`Total ${devices.length} perangkat`}
        searchable
        searchPlaceholder="Cari perangkat..."
        searchKeys={["name", "ip_address"]}
        filters={[
          {
            key: "device_type",
            label: "Tipe",
            options: [
              { value: "mikrotik", label: "MikroTik" },
              { value: "olt", label: "OLT" },
              { value: "switch", label: "Switch" },
              { value: "router", label: "Router" },
              { value: "ont", label: "ONT" },
            ],
          },
          {
            key: "status",
            label: "Status",
            options: [
              { value: "online", label: "Online" },
              { value: "offline", label: "Offline" },
              { value: "maintenance", label: "Maintenance" },
            ],
          },
        ]}
        pagination
        pageSize={10}
        loading={isLoading}
        emptyMessage="Tidak ada perangkat ditemukan"
      />

      <AlertDialog open={!!deviceToDelete} onOpenChange={() => setDeviceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Perangkat</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus perangkat "{deviceToDelete?.name}"?
              Tindakan ini tidak dapat dibatalkan.
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

export default DevicesPage;
