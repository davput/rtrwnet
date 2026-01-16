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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useODPs, useCreateODP, useDeleteODP, useODCs } from '@/hooks/useInfrastructure';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Loader2, MapPin } from 'lucide-react';
import type { CreateODPRequest } from '@/types/infrastructure';

export function ODPList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateODPRequest>({
    odc_id: '',
    name: '',
    location: '',
    total_ports: 8,
  });

  const { data, isLoading } = useODPs();
  const { data: odcsData } = useODCs();
  const createODP = useCreateODP();
  const deleteODP = useDeleteODP();

  const odps = data?.data || [];
  const odcs = odcsData?.data || [];

  const handleCreate = async () => {
    try {
      await createODP.mutateAsync(formData);
      toast.success('ODP berhasil ditambahkan');
      setDialogOpen(false);
      setFormData({
        odc_id: '',
        name: '',
        location: '',
        total_ports: 8,
      });
    } catch {
      toast.error('Gagal menambahkan ODP');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ODP ${name}?`)) {
      try {
        await deleteODP.mutateAsync(id);
        toast.success('ODP berhasil dihapus');
      } catch {
        toast.error('Gagal menghapus ODP');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Optical Distribution Point (ODP)
          </CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah ODP
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah ODP Baru</DialogTitle>
              <DialogDescription>Masukkan informasi ODP</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="odc_id">ODC</Label>
                <Select
                  value={formData.odc_id}
                  onValueChange={(value) => setFormData({ ...formData, odc_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih ODC" />
                  </SelectTrigger>
                  <SelectContent>
                    {odcs.map((odc) => (
                      <SelectItem key={odc.id} value={odc.id}>
                        {odc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ODP-01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Tiang No. 5"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.latitude || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="-6.2088"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.longitude || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: parseFloat(e.target.value) || undefined })
                    }
                    placeholder="106.8456"
                  />
                </div>
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
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleCreate} disabled={createODP.isPending}>
                {createODP.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
                <TableHead>Lokasi</TableHead>
                <TableHead>Port</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {odps.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada ODP
                  </TableCell>
                </TableRow>
              ) : (
                odps.map((odp) => (
                  <TableRow key={odp.id}>
                    <TableCell className="font-medium">{odp.name}</TableCell>
                    <TableCell>{odp.location || '-'}</TableCell>
                    <TableCell>
                      {odp.used_ports}/{odp.total_ports}
                    </TableCell>
                    <TableCell>
                      <Badge className={odp.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {odp.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(odp.id, odp.name)}
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
