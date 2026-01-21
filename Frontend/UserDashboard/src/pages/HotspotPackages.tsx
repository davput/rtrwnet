import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Wifi, LayoutGrid, Table as TableIcon } from 'lucide-react';
import { hotspotPackageApi, HotspotPackage } from '@/api/hotspot.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HotspotPackages() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<HotspotPackage | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packages, isLoading } = useQuery({
    queryKey: ['hotspot-packages'],
    queryFn: hotspotPackageApi.list,
  });

  const createMutation = useMutation({
    mutationFn: hotspotPackageApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-packages'] });
      setIsDialogOpen(false);
      toast({ title: 'Paket berhasil dibuat' });
    },
    onError: () => {
      toast({ title: 'Gagal membuat paket', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => hotspotPackageApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-packages'] });
      setIsDialogOpen(false);
      setEditingPackage(null);
      toast({ title: 'Paket berhasil diupdate' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: hotspotPackageApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-packages'] });
      toast({ title: 'Paket berhasil dihapus' });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      duration_type: formData.get('duration_type') as 'hours' | 'days',
      duration: parseInt(formData.get('duration') as string),
      price: parseInt(formData.get('price') as string),
      speed_upload: parseInt(formData.get('speed_upload') as string),
      speed_download: parseInt(formData.get('speed_download') as string),
      device_limit: parseInt(formData.get('device_limit') as string),
      mac_binding: formData.get('mac_binding') === 'on',
      session_limit: parseInt(formData.get('session_limit') as string),
    };

    if (editingPackage) {
      updateMutation.mutate({ id: editingPackage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatSpeed = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(0)} Mbps`;
    }
    return `${kbps} Kbps`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Paket Hotspot</h1>
          <p className="text-muted-foreground">Kelola paket hotspot untuk voucher</p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => { setEditingPackage(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Buat Paket
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div>Loading...</div>
      ) : viewMode === 'table' ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Paket</TableHead>
                <TableHead>Durasi</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Kecepatan</TableHead>
                <TableHead>Device Limit</TableHead>
                <TableHead>MAC Binding</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Belum ada paket hotspot
                  </TableCell>
                </TableRow>
              ) : (
                packages?.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{pkg.name}</div>
                        <div className="text-sm text-muted-foreground">{pkg.description || '-'}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg.duration} {pkg.duration_type === 'hours' ? 'Jam' : 'Hari'}
                    </TableCell>
                    <TableCell>Rp {pkg.price.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>↑ {formatSpeed(pkg.speed_upload)}</div>
                        <div>↓ {formatSpeed(pkg.speed_download)}</div>
                      </div>
                    </TableCell>
                    <TableCell>{pkg.device_limit} perangkat</TableCell>
                    <TableCell>
                      <Badge variant={pkg.mac_binding ? 'default' : 'secondary'} className="text-xs">
                        {pkg.mac_binding ? 'Ya' : 'Tidak'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                        {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => { setEditingPackage(pkg); setIsDialogOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Yakin ingin menghapus paket ini?')) {
                              deleteMutation.mutate(pkg.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages?.map((pkg) => (
            <Card key={pkg.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-5 w-5 text-primary" />
                    <CardTitle>{pkg.name}</CardTitle>
                  </div>
                  <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                    {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <CardDescription>{pkg.description || 'Tidak ada deskripsi'}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Durasi</p>
                    <p className="font-medium">{pkg.duration} {pkg.duration_type === 'hours' ? 'Jam' : 'Hari'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Harga</p>
                    <p className="font-medium">Rp {pkg.price.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Upload</p>
                    <p className="font-medium">{formatSpeed(pkg.speed_upload)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Download</p>
                    <p className="font-medium">{formatSpeed(pkg.speed_download)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Device Limit</p>
                    <p className="font-medium">{pkg.device_limit} perangkat</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">MAC Binding</p>
                    <p className="font-medium">{pkg.mac_binding ? 'Ya' : 'Tidak'}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setEditingPackage(pkg); setIsDialogOpen(true); }}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      if (confirm('Yakin ingin menghapus paket ini?')) {
                        deleteMutation.mutate(pkg.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPackage ? 'Edit Paket' : 'Buat Paket Baru'}</DialogTitle>
            <DialogDescription>
              Isi form di bawah untuk {editingPackage ? 'mengupdate' : 'membuat'} paket hotspot
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Paket *</Label>
                <Input id="name" name="name" defaultValue={editingPackage?.name} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input id="price" name="price" type="number" defaultValue={editingPackage?.price} required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Deskripsi</Label>
              <Input id="description" name="description" defaultValue={editingPackage?.description} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="duration_type">Tipe Durasi *</Label>
                <Select name="duration_type" defaultValue={editingPackage?.duration_type || 'hours'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hours">Jam</SelectItem>
                    <SelectItem value="days">Hari</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Durasi *</Label>
                <Input id="duration" name="duration" type="number" defaultValue={editingPackage?.duration} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="speed_upload">Kecepatan Upload (Kbps) *</Label>
                <Input id="speed_upload" name="speed_upload" type="number" defaultValue={editingPackage?.speed_upload} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="speed_download">Kecepatan Download (Kbps) *</Label>
                <Input id="speed_download" name="speed_download" type="number" defaultValue={editingPackage?.speed_download} required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="device_limit">Batas Perangkat *</Label>
                <Select name="device_limit" defaultValue={editingPackage?.device_limit?.toString() || '1'}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Perangkat</SelectItem>
                    <SelectItem value="2">2 Perangkat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="session_limit">Batas Sesi *</Label>
                <Input id="session_limit" name="session_limit" type="number" defaultValue={editingPackage?.session_limit || 1} required />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="mac_binding" name="mac_binding" defaultChecked={editingPackage?.mac_binding} />
              <Label htmlFor="mac_binding">Aktifkan MAC Binding</Label>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingPackage ? 'Update' : 'Buat'} Paket
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
