import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOLTs, useCreateOLT, useDeleteOLT } from '@/hooks/useInfrastructure';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Loader2, Server } from 'lucide-react';
import type { CreateOLTRequest } from '@/types/infrastructure';

export function OLTList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateOLTRequest>({
    name: '',
    brand: '',
    model: '',
    ip_address: '',
    location: '',
    total_ports: 8,
  });

  const { data, isLoading } = useOLTs();
  const createOLT = useCreateOLT();
  const deleteOLT = useDeleteOLT();

  const olts = data?.data || [];

  const handleCreate = async () => {
    try {
      await createOLT.mutateAsync(formData);
      toast.success('OLT berhasil ditambahkan');
      setDialogOpen(false);
      setFormData({
        name: '',
        brand: '',
        model: '',
        ip_address: '',
        location: '',
        total_ports: 8,
      });
    } catch {
      toast.error('Gagal menambahkan OLT');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus OLT ${name}?`)) {
      try {
        await deleteOLT.mutateAsync(id);
        toast.success('OLT berhasil dihapus');
      } catch {
        toast.error('Gagal menghapus OLT');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Optical Line Terminal (OLT)
          </CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah OLT
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah OLT Baru</DialogTitle>
              <DialogDescription>Masukkan informasi OLT</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="OLT-01"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="Huawei"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    placeholder="MA5608T"
                  />
                </div>
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
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Data Center"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_ports">Total Port</Label>
                  <Input
                    id="total_ports"
                    type="number"
                    value={formData.total_ports}
                    onChange={(e) =>
                      setFormData({ ...formData, total_ports: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={createOLT.isPending}>
                {createOLT.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Brand/Model</TableHead>
                <TableHead>IP Address</TableHead>
                <TableHead>Lokasi</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {olts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Belum ada OLT
                  </TableCell>
                </TableRow>
              ) : (
                olts.map((olt) => (
                  <TableRow key={olt.id}>
                    <TableCell className="font-medium">{olt.name}</TableCell>
                    <TableCell>
                      {olt.brand} {olt.model}
                    </TableCell>
                    <TableCell>{olt.ip_address}</TableCell>
                    <TableCell>{olt.location || '-'}</TableCell>
                    <TableCell>
                      {olt.used_ports}/{olt.total_ports}
                    </TableCell>
                    <TableCell>
                      <Badge className={olt.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {olt.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(olt.id, olt.name)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
