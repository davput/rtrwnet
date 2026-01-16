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
import { useODCs, useCreateODC, useDeleteODC } from '@/hooks/useInfrastructure';
import { useOLTs } from '@/hooks/useInfrastructure';
import { toast } from 'sonner';
import { Plus, Trash2, Edit, Loader2, Box } from 'lucide-react';
import type { CreateODCRequest } from '@/types/infrastructure';

export function ODCList() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateODCRequest>({
    olt_id: '',
    name: '',
    location: '',
    total_ports: 8,
  });

  const { data, isLoading } = useODCs();
  const { data: oltsData } = useOLTs();
  const createODC = useCreateODC();
  const deleteODC = useDeleteODC();

  const odcs = data?.data || [];
  const olts = oltsData?.data || [];

  const handleCreate = async () => {
    try {
      await createODC.mutateAsync(formData);
      toast.success('ODC berhasil ditambahkan');
      setDialogOpen(false);
      setFormData({
        olt_id: '',
        name: '',
        location: '',
        total_ports: 8,
      });
    } catch {
      toast.error('Gagal menambahkan ODC');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus ODC ${name}?`)) {
      try {
        await deleteODC.mutateAsync(id);
        toast.success('ODC berhasil dihapus');
      } catch {
        toast.error('Gagal menghapus ODC');
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Box className="h-5 w-5" />
            Optical Distribution Cabinet (ODC)
          </CardTitle>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Tambah ODC
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah ODC Baru</DialogTitle>
              <DialogDescription>Masukkan informasi ODC</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="olt_id">OLT</Label>
                <Select
                  value={formData.olt_id}
                  onValueChange={(value) => setFormData({ ...formData, olt_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih OLT" />
                  </SelectTrigger>
                  <SelectContent>
                    {olts.map((olt) => (
                      <SelectItem key={olt.id} value={olt.id}>
                        {olt.name}
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
                  placeholder="ODC-01"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Lokasi</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Jl. Contoh No. 1"
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
              <Button onClick={handleCreate} disabled={createODC.isPending}>
                {createODC.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              {odcs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Belum ada ODC
                  </TableCell>
                </TableRow>
              ) : (
                odcs.map((odc) => (
                  <TableRow key={odc.id}>
                    <TableCell className="font-medium">{odc.name}</TableCell>
                    <TableCell>{odc.location || '-'}</TableCell>
                    <TableCell>
                      {odc.used_ports}/{odc.total_ports}
                    </TableCell>
                    <TableCell>
                      <Badge className={odc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {odc.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(odc.id, odc.name)}
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
