import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wifi, WifiOff, RefreshCw, Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { customerHotspotApi } from "@/api/customers.api";
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

interface HotspotTabProps {
  customerId: string;
  hotspotEnabled: boolean;
  hotspotUsername?: string;
  onUpdate: () => void;
}

export function HotspotTab({ customerId, hotspotEnabled: initialEnabled, hotspotUsername: initialUsername, onUpdate }: HotspotTabProps) {
  const { toast } = useToast();
  const [enabled, setEnabled] = useState(initialEnabled);
  const [username, setUsername] = useState(initialUsername || "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const handleEnable = async () => {
    setLoading(true);
    try {
      const data = await customerHotspotApi.enableHotspot(customerId);
      setEnabled(true);
      setUsername(data.username);
      setPassword(data.password);
      toast({ title: "Berhasil", description: "Hotspot berhasil diaktifkan" });
      onUpdate();
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengaktifkan hotspot", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    setLoading(true);
    try {
      await customerHotspotApi.disableHotspot(customerId);
      setEnabled(false);
      setPassword("");
      toast({ title: "Berhasil", description: "Hotspot berhasil dinonaktifkan" });
      onUpdate();
    } catch (error) {
      toast({ title: "Error", description: "Gagal menonaktifkan hotspot", variant: "destructive" });
    } finally {
      setLoading(false);
      setShowDisableDialog(false);
    }
  };

  const handleRegeneratePassword = async () => {
    setLoading(true);
    try {
      const data = await customerHotspotApi.regeneratePassword(customerId);
      setPassword(data.password);
      toast({ title: "Berhasil", description: "Password berhasil di-generate ulang" });
    } catch (error) {
      toast({ title: "Error", description: "Gagal generate password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGetCredentials = async () => {
    setLoading(true);
    try {
      const data = await customerHotspotApi.getCredentials(customerId);
      setPassword(data.password);
    } catch (error) {
      toast({ title: "Error", description: "Gagal mengambil credentials", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Tersalin", description: `${label} berhasil disalin` });
  };

  if (!enabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Akses Hotspot Tidak Aktif
          </CardTitle>
          <CardDescription>
            Aktifkan akses hotspot untuk pelanggan ini agar bisa login ke jaringan WiFi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleEnable} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Wifi className="mr-2 h-4 w-4" />
            Aktifkan Hotspot
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5 text-green-600" />
                Akses Hotspot Aktif
              </CardTitle>
              <CardDescription>
                Pelanggan dapat login ke jaringan WiFi menggunakan credentials di bawah
              </CardDescription>
            </div>
            <Badge variant="default" className="bg-green-600">Aktif</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Username</Label>
              <div className="flex gap-2">
                <Input value={username} readOnly className="font-mono" />
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(username, "Username")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Password</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    value={password || "••••••••••••"} 
                    readOnly 
                    className="font-mono pr-10"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => {
                      if (!password) {
                        handleGetCredentials();
                      } else {
                        setShowPassword(!showPassword);
                      }
                    }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {password && (
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(password, "Password")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Klik icon mata untuk melihat password
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleRegeneratePassword} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate Password Baru
            </Button>
            <Button variant="destructive" onClick={() => setShowDisableDialog(true)} disabled={loading}>
              <WifiOff className="mr-2 h-4 w-4" />
              Nonaktifkan Hotspot
            </Button>
          </div>

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Info:</strong> Credentials ini dapat digunakan pelanggan untuk login ke jaringan WiFi hotspot. 
              Pastikan untuk memberikan informasi ini kepada pelanggan dengan aman.
            </p>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Hotspot?</AlertDialogTitle>
            <AlertDialogDescription>
              Pelanggan tidak akan bisa login ke jaringan WiFi setelah hotspot dinonaktifkan. 
              Anda dapat mengaktifkannya kembali kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisable} disabled={loading} className="bg-red-600 hover:bg-red-700">
              {loading ? "Menonaktifkan..." : "Nonaktifkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
