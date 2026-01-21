import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RefreshCw, UserX, Wifi } from 'lucide-react';
import { hotspotSessionApi } from '@/api/hotspot.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function HotspotSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sessions, isLoading, refetch } = useQuery({
    queryKey: ['hotspot-sessions'],
    queryFn: hotspotSessionApi.list,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const disconnectMutation = useMutation({
    mutationFn: hotspotSessionApi.disconnect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotspot-sessions'] });
      toast({ title: 'Sesi berhasil diputuskan' });
    },
    onError: () => {
      toast({ title: 'Gagal memutuskan sesi', variant: 'destructive' });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const activeSessions = sessions?.filter(s => s.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sesi Hotspot Aktif</h1>
          <p className="text-muted-foreground">Monitor pengguna hotspot yang sedang online</p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sesi Aktif</CardTitle>
            <Wifi className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeSessions.length}</div>
            <p className="text-xs text-muted-foreground">Pengguna online saat ini</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(activeSessions.reduce((sum, s) => sum + s.upload_bytes, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Data yang diupload</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Download</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(activeSessions.reduce((sum, s) => sum + s.download_bytes, 0))}
            </div>
            <p className="text-xs text-muted-foreground">Data yang didownload</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Sesi Aktif</CardTitle>
          <CardDescription>
            Data diperbarui otomatis setiap 5 detik
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading...</div>
          ) : activeSessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Tidak ada sesi aktif saat ini
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>MAC Address</TableHead>
                    <TableHead>Paket</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>Upload</TableHead>
                    <TableHead>Download</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSessions.map((session) => (
                    <TableRow key={session.session_id}>
                      <TableCell className="font-mono text-sm">{session.username}</TableCell>
                      <TableCell className="font-mono text-sm">{session.ip_address}</TableCell>
                      <TableCell className="font-mono text-xs">{session.mac_address || '-'}</TableCell>
                      <TableCell>{session.package_name}</TableCell>
                      <TableCell className="font-mono">{session.duration}</TableCell>
                      <TableCell>{formatBytes(session.upload_bytes)}</TableCell>
                      <TableCell>{formatBytes(session.download_bytes)}</TableCell>
                      <TableCell>
                        <Badge variant="default">Aktif</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm('Yakin ingin memutuskan sesi ini?')) {
                              disconnectMutation.mutate(session.session_id);
                            }
                          }}
                          disabled={disconnectMutation.isPending}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
