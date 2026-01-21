import { useState, useEffect } from 'react';
import { Copy, Download, CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/api/axios';

interface MikroTikScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nasId: string;
  nasName: string;
}

interface ScriptResponse {
  script: string;
  server_ip: string;
  server_port: number;
  client_ip: string;
  client_name: string;
  instructions: string[];
}

export function MikroTikScriptModal({
  open,
  onOpenChange,
  nasId,
  nasName,
}: MikroTikScriptModalProps) {
  const [loading, setLoading] = useState(false);
  const [scriptData, setScriptData] = useState<ScriptResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScript = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get<{ data: ScriptResponse }>(`/vpn/mikrotik-script/${nasId}`);
      setScriptData(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to generate script');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyScript = async () => {
    if (!scriptData) return;
    
    try {
      await navigator.clipboard.writeText(scriptData.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownloadScript = () => {
    if (!scriptData) return;
    
    const blob = new Blob([scriptData.script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mikrotik-setup-${scriptData.client_name}.rsc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Fetch script when modal opens
  useEffect(() => {
    if (open) {
      setScriptData(null);
      fetchScript();
    }
  }, [open, nasId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup MikroTik - {nasName}</DialogTitle>
          <DialogDescription>
            Script otomatis untuk menghubungkan MikroTik ke RADIUS server melalui VPN (Username/Password Auth)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Generating script...</span>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="link" size="sm" onClick={fetchScript} className="ml-2">
                <RefreshCw className="h-3 w-3 mr-1" />
                Coba lagi
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {scriptData && (
          <Tabs defaultValue="script" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="script">Script</TabsTrigger>
              <TabsTrigger value="instructions">Instruksi</TabsTrigger>
              <TabsTrigger value="info">Info Koneksi</TabsTrigger>
            </TabsList>

            <TabsContent value="script" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Copy script dan paste ke terminal MikroTik
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleDownloadScript} variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download .rsc
                  </Button>
                  <Button onClick={handleCopyScript} size="sm">
                    {copied ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Script
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-[500px] overflow-y-auto whitespace-pre-wrap">
                  {scriptData.script}
                </pre>
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-xs">
                  <strong>Tidak perlu import certificate!</strong> Script ini menggunakan autentikasi username/password.
                  Cukup copy-paste dan jalankan.
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="instructions" className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Ikuti langkah-langkah berikut untuk setup MikroTik Anda
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                {scriptData.instructions.map((instruction, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <p className="text-sm text-muted-foreground pt-0.5">
                      {instruction}
                    </p>
                  </div>
                ))}
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <h4 className="font-medium text-yellow-900 mb-2">⚠️ Penting:</h4>
                <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
                  <li>Pastikan MikroTik memiliki akses internet</li>
                  <li>Backup konfigurasi sebelum menjalankan script</li>
                  <li>Script akan membuat interface VPN "RTRWNET_VPN"</li>
                  <li>RADIUS otomatis dikonfigurasi setelah VPN terhubung</li>
                  <li>Failover scheduler akan auto-reconnect jika VPN terputus</li>
                </ul>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Cara paste di MikroTik:</strong>
                  <br />
                  1. Buka Winbox → New Terminal
                  <br />
                  2. Klik kanan di terminal → Paste
                  <br />
                  3. Tunggu script selesai dijalankan
                  <br />
                  4. Verifikasi dengan: <code className="bg-slate-100 px-1 rounded">/interface ovpn-client print</code>
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">VPN Server</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Server:</dt>
                      <dd className="font-mono">{scriptData.server_ip}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Port:</dt>
                      <dd className="font-mono">{scriptData.server_port}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Protocol:</dt>
                      <dd className="font-mono">TCP (OpenVPN)</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Auth:</dt>
                      <dd className="font-mono text-green-600">Username/Password</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">MikroTik Info</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Nama:</dt>
                      <dd className="font-mono">{scriptData.client_name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">VPN IP:</dt>
                      <dd className="font-mono">{scriptData.client_ip}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">RADIUS Server:</dt>
                      <dd className="font-mono">10.8.0.1</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Verifikasi Koneksi</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Setelah script dijalankan, verifikasi dengan command:
                </p>
                <div className="space-y-2">
                  <div className="bg-slate-950 text-slate-50 p-2 rounded font-mono text-xs">
                    /interface ovpn-client print
                  </div>
                  <div className="bg-slate-950 text-slate-50 p-2 rounded font-mono text-xs">
                    /radius print
                  </div>
                  <div className="bg-slate-950 text-slate-50 p-2 rounded font-mono text-xs">
                    /ping 10.8.0.1
                  </div>
                </div>
              </div>

              <Alert>
                <AlertDescription className="text-sm">
                  <strong>Status VPN:</strong> Cek dengan{' '}
                  <code className="bg-slate-100 px-1 rounded">/interface ovpn-client print</code>.
                  Status harus menunjukkan flag <strong>R</strong> (Running).
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Tutup
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
