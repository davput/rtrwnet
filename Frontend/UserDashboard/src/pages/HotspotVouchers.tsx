import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Trash2, Filter } from 'lucide-react';
import { hotspotVoucherApi, hotspotPackageApi } from '@/api/hotspot.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HotspotVouchers() {
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [filters, setFilters] = useState({ status: '', package_id: '', page: 1 });
  const [generatedVouchers, setGeneratedVouchers] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: packages } = useQuery({
    queryKey: ['hotspot-packages'],
    queryFn: hotspotPackageApi.list,
  });

  const { data: vouchersData, isLoading } = useQuery({
    queryKey: ['hotspot-vouchers', filters],
    queryFn: () => hotspotVoucherApi.list(filters),
  });

  const generateMutation = useMutation({
    mutationFn: hotspotVoucherApi.generate,
    onSuccess: (vouchers) => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-vouchers'] });
      setGeneratedVouchers(vouchers);
      toast({ title: 'Voucher berhasil digenerate' });
    },
    onError: () => {
      toast({ title: 'Gagal generate voucher', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: hotspotVoucherApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-vouchers'] });
      toast({ title: 'Voucher berhasil dihapus' });
    },
  });

  const handleGenerate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    generateMutation.mutate({
      package_id: formData.get('package_id') as string,
      quantity: parseInt(formData.get('quantity') as string),
      prefix: formData.get('prefix') as string || undefined,
    });
  };

  const downloadVouchers = () => {
    const csv = [
      ['Kode Voucher', 'Password', 'Paket', 'Status'].join(','),
      ...generatedVouchers.map(v => [
        v.voucher_code,
        v.voucher_password,
        v.package_name,
        v.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers-${Date.now()}.csv`;
    a.click();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      unused: 'secondary',
      active: 'default',
      expired: 'destructive',
      used: 'outline',
    };
    const labels: Record<string, string> = {
      unused: 'Belum Digunakan',
      active: 'Aktif',
      expired: 'Kedaluwarsa',
      used: 'Terpakai',
    };
    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Voucher Hotspot</h1>
          <p className="text-muted-foreground">Generate dan kelola voucher hotspot</p>
        </div>
        <Button onClick={() => { setGeneratedVouchers([]); setIsGenerateOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Generate Voucher
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(v) => setFilters({ ...filters, status: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="unused">Belum Digunakan</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="expired">Kedaluwarsa</SelectItem>
                  <SelectItem value="used">Terpakai</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Paket</Label>
              <Select value={filters.package_id || 'all'} onValueChange={(v) => setFilters({ ...filters, package_id: v === 'all' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua Paket" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Paket</SelectItem>
                  {packages?.map((pkg) => (
                    <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Voucher</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode Voucher</TableHead>
                  <TableHead>Paket</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Diaktifkan</TableHead>
                  <TableHead>Kedaluwarsa</TableHead>
                  <TableHead>MAC Address</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vouchersData?.data?.map((voucher: any) => (
                  <TableRow key={voucher.id}>
                    <TableCell className="font-mono">{voucher.voucher_code}</TableCell>
                    <TableCell>{voucher.package_name}</TableCell>
                    <TableCell>{getStatusBadge(voucher.status)}</TableCell>
                    <TableCell>
                      {voucher.activated_at ? new Date(voucher.activated_at).toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell>
                      {voucher.expires_at ? new Date(voucher.expires_at).toLocaleString('id-ID') : '-'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{voucher.device_mac || '-'}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Yakin ingin menghapus voucher ini?')) {
                            deleteMutation.mutate(voucher.id);
                          }
                        }}
                        disabled={voucher.status === 'active'}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Voucher</DialogTitle>
            <DialogDescription>
              Buat voucher baru untuk paket hotspot yang dipilih
            </DialogDescription>
          </DialogHeader>

          {generatedVouchers.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {generatedVouchers.length} voucher berhasil digenerate
                </p>
                <Button onClick={downloadVouchers} size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </Button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kode</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {generatedVouchers.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell className="font-mono">{v.voucher_code}</TableCell>
                        <TableCell className="font-mono">{v.voucher_password}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Button onClick={() => { setGeneratedVouchers([]); setIsGenerateOpen(false); }} className="w-full">
                Tutup
              </Button>
            </div>
          ) : (
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="package_id">Paket *</Label>
                <Select name="package_id" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih paket" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages?.filter(p => p.is_active).map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - {pkg.duration} {pkg.duration_type === 'hours' ? 'Jam' : 'Hari'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Jumlah Voucher (Max 100) *</Label>
                <Input id="quantity" name="quantity" type="number" min="1" max="100" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="prefix">Prefix (Opsional)</Label>
                <Input id="prefix" name="prefix" placeholder="Contoh: HSP" maxLength={5} />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsGenerateOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" disabled={generateMutation.isPending}>
                  Generate
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
