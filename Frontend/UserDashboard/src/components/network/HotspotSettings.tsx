
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

export function HotspotSettings() {
  const [saving, setSaving] = useState(false);
  const [enabled, setEnabled] = useState(false);
  
  const handleSave = () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      toast.success("Konfigurasi Hotspot berhasil disimpan");
    }, 1000);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Status Hotspot</CardTitle>
            <div className="flex items-center space-x-2">
              <Switch 
                checked={enabled} 
                onCheckedChange={setEnabled} 
                id="hotspot-status" 
              />
              <Label htmlFor="hotspot-status">
                {enabled ? "Aktif" : "Nonaktif"}
              </Label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {enabled 
              ? "Server Hotspot sedang berjalan. Anda dapat mengubah konfigurasi di bawah ini." 
              : "Server Hotspot tidak aktif. Aktifkan switch untuk menjalankan server."}
          </p>
        </CardContent>
      </Card>
      
      <Card className={!enabled ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Konfigurasi Server Hotspot</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="general">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Umum</TabsTrigger>
              <TabsTrigger value="server">Server</TabsTrigger>
              <TabsTrigger value="ip">IP & DHCP</TabsTrigger>
              <TabsTrigger value="users">Pengguna</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="hotspot-name">Nama Hotspot</Label>
                  <Input id="hotspot-name" placeholder="RT/RW Net Hotspot" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interface">Interface</Label>
                  <Select defaultValue="wlan1">
                    <SelectTrigger id="interface">
                      <SelectValue placeholder="Pilih Interface" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wlan1">wlan1</SelectItem>
                      <SelectItem value="wlan2">wlan2</SelectItem>
                      <SelectItem value="ether1">ether1</SelectItem>
                      <SelectItem value="ether2">ether2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="domain">Domain Name</Label>
                <Input id="domain" placeholder="login.rtwnet.id" />
                <p className="text-xs text-muted-foreground mt-1">
                  Nama domain untuk halaman login hotspot
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="server" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="profile">Profil</Label>
                  <Select defaultValue="default">
                    <SelectTrigger id="profile">
                      <SelectValue placeholder="Pilih Profil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">default</SelectItem>
                      <SelectItem value="harian">Harian</SelectItem>
                      <SelectItem value="mingguan">Mingguan</SelectItem>
                      <SelectItem value="bulanan">Bulanan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idle-timeout">Idle Timeout (menit)</Label>
                  <Input id="idle-timeout" type="number" defaultValue="15" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Pengaturan Keamanan</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center space-x-2">
                    <Switch id="https" />
                    <Label htmlFor="https">Gunakan HTTPS</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="cookie" defaultChecked />
                    <Label htmlFor="cookie">Gunakan Cookie</Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="ip" className="space-y-4 mt-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="address">Alamat Server</Label>
                  <Input id="address" placeholder="192.168.88.1" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="netmask">Netmask</Label>
                  <Input id="netmask" placeholder="255.255.255.0" />
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="pool-start">Pool Mulai</Label>
                  <Input id="pool-start" placeholder="192.168.88.2" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pool-end">Pool Akhir</Label>
                  <Input id="pool-end" placeholder="192.168.88.254" />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dns">DNS Servers</Label>
                <Input id="dns" placeholder="8.8.8.8,8.8.4.4" />
                <p className="text-xs text-muted-foreground mt-1">
                  Pisahkan beberapa DNS server dengan koma
                </p>
              </div>
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4 mt-4">
              <div className="flex justify-between items-center pb-4 border-b">
                <p className="text-sm text-muted-foreground">
                  Kelola akun pengguna yang dapat login ke hotspot
                </p>
                <Button size="sm">
                  Tambah Pengguna
                </Button>
              </div>
              
              <div className="border rounded-md">
                <div className="grid grid-cols-5 p-4 border-b font-medium">
                  <div>Username</div>
                  <div>Profil</div>
                  <div>Waktu Tersisa</div>
                  <div>Status</div>
                  <div className="text-right">Aksi</div>
                </div>
                <div className="grid grid-cols-5 p-4 border-b items-center">
                  <div>user1</div>
                  <div>Harian</div>
                  <div>5 jam</div>
                  <div>
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 mr-1" />
                      Aktif
                    </Badge>
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 p-4 border-b items-center">
                  <div>user2</div>
                  <div>Bulanan</div>
                  <div>25 hari</div>
                  <div>
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-yellow-500 mr-1" />
                      Idle
                    </Badge>
                  </div>
                  <div className="text-right">
                    <Button variant="ghost" size="sm">Edit</Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan Konfigurasi"}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className={!enabled ? "opacity-60 pointer-events-none" : ""}>
        <CardHeader>
          <CardTitle>Template Login Hotspot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <Select defaultValue="default">
                  <SelectTrigger id="template">
                    <SelectValue placeholder="Pilih Template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Template Default</SelectItem>
                    <SelectItem value="simple">Template Sederhana</SelectItem>
                    <SelectItem value="fancy">Template Modern</SelectItem>
                    <SelectItem value="custom">Template Kustom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input id="logo" placeholder="https://example.com/logo.png" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="custom-css">Custom CSS</Label>
              <Textarea 
                id="custom-css" 
                placeholder="Tambahkan CSS kustom disini..." 
                className="h-24"
              />
            </div>
            
            <Button variant="outline" size="sm">
              Lihat Pratinjau
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
