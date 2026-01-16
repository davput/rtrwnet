import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Copy, 
  Download, 
  Server, 
  Shield, 
  Terminal, 
  CheckCircle2, 
  Loader2,
  Network,
  Info
} from 'lucide-react';
import { apiClient } from '@/services/api/client';

interface NAS {
  id: string;
  nasname: string;
  shortname: string;
  secret: string;
  is_active: boolean;
}

export function VPNSetup() {
  const [nasList, setNasList] = useState<NAS[]>([]);
  const [selectedNAS, setSelectedNAS] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [script, setScript] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNASList();
  }, []);

  const fetchNASList = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/radius/nas');
      setNasList(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch NAS list:', err);
      setError('Gagal memuat daftar NAS');
    } finally {
      setLoading(false);
    }
  };

  const generateScript = async () => {
    if (!selectedNAS) return;
    
    try {
      setGenerating(true);
      setError(null);
      const res = await apiClient.get(`/vpn/mikrotik-script/${selectedNAS}`);
      setScript(res.data.data?.script || '');
    } catch (err) {
      console.error('Failed to generate script:', err);
      setError('Gagal generate script');
    } finally {
      setGenerating(false);
    }
  };

  const downloadOVPN = async () => {
    if (!selectedNAS) return;
    
    try {
      const res = await apiClient.get(`/vpn/download/${selectedNAS}`, {
        responseType: 'blob'
      });
      
      const nas = nasList.find(n => n.id === selectedNAS);
      const filename = `${nas?.shortname || 'client'}.ovpn`;
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to download config:', err);
      setError('Gagal download config');
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">VPN Setup</h2>
        <p className="text-muted-foreground">
          Konfigurasi OpenVPN untuk menghubungkan MikroTik ke server RADIUS
        </p>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          VPN diperlukan agar MikroTik di lokasi pelanggan dapat terhubung ke server RADIUS di VPS. 
          Setelah VPN terhubung, MikroTik akan menggunakan IP internal VPN untuk komunikasi RADIUS.
        </AlertDescription>
      </Alert>

      {/* Architecture Diagram */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Arsitektur Koneksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-4 py-4 text-sm">
            <div className="text-center p-4 border rounded-lg bg-muted/50">
              <Server className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-medium">MikroTik</div>
              <div className="text-xs text-muted-foreground">Router Pelanggan</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-0.5 bg-green-500"></div>
              <div className="text-xs text-green-600 mt-1">OpenVPN</div>
            </div>
            <div className="text-center p-4 border rounded-lg bg-muted/50">
              <Shield className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-medium">VPS Server</div>
              <div className="text-xs text-muted-foreground">OpenVPN + RADIUS</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NAS Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Pilih NAS (MikroTik)</CardTitle>
          <CardDescription>
            Pilih router MikroTik yang akan dikonfigurasi
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Memuat daftar NAS...</span>
            </div>
          ) : nasList.length === 0 ? (
            <Alert>
              <AlertDescription>
                Belum ada NAS terdaftar. Tambahkan NAS terlebih dahulu di menu RADIUS &gt; NAS.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex gap-4">
              <Select value={selectedNAS} onValueChange={setSelectedNAS}>
                <SelectTrigger className="w-[300px]">
                  <SelectValue placeholder="Pilih NAS..." />
                </SelectTrigger>
                <SelectContent>
                  {nasList.map((nas) => (
                    <SelectItem key={nas.id} value={nas.id}>
                      <div className="flex items-center gap-2">
                        <span>{nas.shortname}</span>
                        <span className="text-muted-foreground">({nas.nasname})</span>
                        {nas.is_active && (
                          <Badge variant="outline" className="text-green-600">Active</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={generateScript} disabled={!selectedNAS || generating}>
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Terminal className="h-4 w-4 mr-2" />
                    Generate Script
                  </>
                )}
              </Button>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Generated Script */}
      {script && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Terminal className="h-5 w-5" />
                MikroTik Script
              </CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Script
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm" onClick={downloadOVPN}>
                  <Download className="h-4 w-4 mr-2" />
                  Download .ovpn
                </Button>
              </div>
            </div>
            <CardDescription>
              Copy script ini dan paste di terminal MikroTik
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="script">
              <TabsList>
                <TabsTrigger value="script">Script</TabsTrigger>
                <TabsTrigger value="instructions">Instruksi</TabsTrigger>
              </TabsList>
              
              <TabsContent value="script">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs max-h-[500px] overflow-y-auto">
                  <code>{script}</code>
                </pre>
              </TabsContent>
              
              <TabsContent value="instructions">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Langkah-langkah Setup:</h4>
                    <ol className="list-decimal list-inside space-y-2 text-sm">
                      <li>
                        <strong>Setup OpenVPN Server di VPS</strong>
                        <p className="text-muted-foreground ml-5">
                          Install OpenVPN server di VPS dan konfigurasi sesuai kebutuhan
                        </p>
                      </li>
                      <li>
                        <strong>Import Certificates di MikroTik</strong>
                        <p className="text-muted-foreground ml-5">
                          Buka Winbox → System → Certificates → Import
                        </p>
                      </li>
                      <li>
                        <strong>Jalankan Script</strong>
                        <p className="text-muted-foreground ml-5">
                          Copy script di atas dan paste di Terminal MikroTik
                        </p>
                      </li>
                      <li>
                        <strong>Verifikasi Koneksi VPN</strong>
                        <p className="text-muted-foreground ml-5">
                          Cek dengan: /interface ovpn-client print
                        </p>
                      </li>
                      <li>
                        <strong>Test RADIUS</strong>
                        <p className="text-muted-foreground ml-5">
                          Cek dengan: /radius print dan ping ke RADIUS server
                        </p>
                      </li>
                    </ol>
                  </div>
                  
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Penting:</strong> Pastikan port 1194 UDP terbuka di firewall VPS 
                      dan MikroTik dapat mengakses internet.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
