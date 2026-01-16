
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";

export function PPPoESettings() {
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  
  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast.success("Konfigurasi PPPoE berhasil disimpan");
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status PPPoE Server</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={enabled} 
                onCheckedChange={setEnabled} 
                id="pppoe-status" 
              />
              <Label htmlFor="pppoe-status">
                {enabled ? "Aktif" : "Nonaktif"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {enabled 
              ? "Server PPPoE sedang berjalan. Anda dapat mengubah konfigurasi di bawah ini." 
              : "Server PPPoE tidak aktif. Aktifkan switch untuk menjalankan server."}
          </p>
        </CardContent>
      </Card>
      
      <Card className={!enabled ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Konfigurasi Server PPPoE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="service-name">Nama Layanan</Label>
              <Input id="service-name" placeholder="RT/RW Net" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="interface">Interface</Label>
              <Select defaultValue="ether1">
                <SelectTrigger id="interface">
                  <SelectValue placeholder="Pilih Interface" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ether1">ether1</SelectItem>
                  <SelectItem value="ether2">ether2</SelectItem>
                  <SelectItem value="ether3">ether3</SelectItem>
                  <SelectItem value="ether4">ether4</SelectItem>
                  <SelectItem value="ether5">ether5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="address-pool">Pool Alamat IP</Label>
              <Select defaultValue="default-dhcp">
                <SelectTrigger id="address-pool">
                  <SelectValue placeholder="Pilih Pool" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default-dhcp">default-dhcp (192.168.1.2-192.168.1.254)</SelectItem>
                  <SelectItem value="pool1">pool1 (10.0.0.2-10.0.0.254)</SelectItem>
                  <SelectItem value="pool2">pool2 (172.16.0.2-172.16.0.254)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile">Profil</Label>
              <Select defaultValue="default">
                <SelectTrigger id="profile">
                  <SelectValue placeholder="Pilih Profil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">default</SelectItem>
                  <SelectItem value="2mbps">2Mbps</SelectItem>
                  <SelectItem value="5mbps">5Mbps</SelectItem>
                  <SelectItem value="10mbps">10Mbps</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Pengaturan Keamanan</Label>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center space-x-2">
                <Switch id="require-chap" />
                <Label htmlFor="require-chap">Wajib CHAP</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="require-mschap2" defaultChecked />
                <Label htmlFor="require-mschap2">Wajib MSCHAPv2</Label>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className={!enabled ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Manajemen Pengguna PPPoE</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center pb-4 border-b">
            <p className="text-sm text-muted-foreground">
              Kelola akun pengguna yang dapat terhubung ke server PPPoE
            </p>
            <Button size="sm">
              Tambah Pengguna
            </Button>
          </div>
          
          <div className="border rounded-md">
            <div className="grid grid-cols-5 p-4 border-b font-medium">
              <div>Username</div>
              <div>Password</div>
              <div>Profil</div>
              <div>Status</div>
              <div className="text-right">Aksi</div>
            </div>
            <div className="p-4 text-center text-muted-foreground">
              Belum ada pengguna PPPoE. Tambahkan pengguna baru.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
