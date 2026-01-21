import { useState } from 'react';
import { Copy, Download, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
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
      const response = await api.get(`/vpn/mikrotik-script/${nasId}`);
      setScriptData(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate script');
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

  const handleDownloadOVPN = async () => {
    try {
      const response = await api.get(`/vpn/download-ovpn/${nasId}`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/x-openvpn-profile' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${scriptData?.client_name || 'client'}.ovpn`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download OVPN:', err);
    }
  };

  // Fetch script when modal opens
  useState(() => {
    if (open && !scriptData) {
      fetchScript();
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup MikroTik - {nasName}</DialogTitle>
          <DialogDescription>
            Script otomatis untuk menghubungkan MikroTik ke RADIUS server melalui VPN
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
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scriptData && (
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instructions">Instruksi</TabsTrigger>
              <TabsTrigger value="script">Script</TabsTrigger>
              <TabsTrigger value="info">Info Koneksi</TabsTrigger>
            </TabsList>

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
                  <li>Pastikan MikroTik Anda memiliki akses internet</li>
                  <li>Backup konfigurasi MikroTik sebelum menjalankan script</li>
                  <li>Script ini akan membuat interface VPN baru bernama "ovpn-to-vps"</li>
                  <li>RADIUS akan otomatis dikonfigurasi setelah VPN terhubung</li>
                </ul>
              </div>

              <div className="flex gap-2 mt-4">
                <Button onClick={handleDownloadScript} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download Script (.rsc)
                </Button>
                <Button onClick={handleDownloadOVPN} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download OVPN Config
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="script" className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Copy script di bawah dan paste ke terminal MikroTik
                </p>
                <Button
                  onClick={handleCopyScript}
                  variant="outline"
                  size="sm"
                >
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

              <div className="relative">
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-x-auto text-xs font-mono max-h-[500px] overflow-y-auto">
                  {scriptData.script}
                </pre>
              </div>

              <Alert>
                <AlertDescription className="text-xs">
                  <strong>Cara paste di MikroTik:</strong>
                  <br />
                  1. Buka Winbox atau SSH ke MikroTik
                  <br />
                  2. Buka Terminal (New Terminal)
                  <br />
                  3. Klik kanan di terminal dan pilih "Paste"
                  <br />
                  4. Tekan Enter untuk menjalankan
                </AlertDescription>
              </Alert>
            </TabsContent>

            <TabsContent value="info" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">VPN Server</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Server IP:</dt>
                      <dd className="font-mono">{scriptData.server_ip}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Port:</dt>
                      <dd className="font-mono">{scriptData.server_port}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Protocol:</dt>
                      <dd className="font-mono">UDP</dd>
                    </div>
                  </dl>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Client Info</h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Client Name:</dt>
                      <dd className="font-mono">{scriptData.client_name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">VPN IP:</dt>
                      <dd className="font-mono">{scriptData.client_ip}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">RADIUS IP:</dt>
                      <dd className="font-mono">10.8.0.1</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Verifikasi Koneksi</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Setelah menjalankan script, verifikasi koneksi dengan command berikut:
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
                  <strong>Status VPN:</strong> Setelah script dijalankan, tunggu beberapa detik
                  untuk VPN terhubung. Cek status dengan command{' '}
                  <code className="bg-slate-100 px-1 rounded">/interface ovpn-client print</code>.
                  Status harus "connected" (R flag).
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
