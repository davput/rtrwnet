
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  CreditCard,
  CreditCardIcon,
  Settings,
  CheckCircle2,
  XCircle
} from "lucide-react";

// Form schemas
const midtransSchema = z.object({
  clientKey: z.string().min(1, { message: "Client Key diperlukan" }),
  serverKey: z.string().min(1, { message: "Server Key diperlukan" }),
  merchantId: z.string().min(1, { message: "Merchant ID diperlukan" }),
  enabled: z.boolean().default(false),
  isProduction: z.boolean().default(false),
});

const duitkuSchema = z.object({
  merchantCode: z.string().min(1, { message: "Merchant Code diperlukan" }),
  apiKey: z.string().min(1, { message: "API Key diperlukan" }),
  enabled: z.boolean().default(false),
  isProduction: z.boolean().default(false),
});

export function PaymentSettings() {
  const [activeGateway, setActiveGateway] = useState("midtrans");

  // Midtrans form
  const midtransForm = useForm<z.infer<typeof midtransSchema>>({
    resolver: zodResolver(midtransSchema),
    defaultValues: {
      clientKey: "",
      serverKey: "",
      merchantId: "",
      enabled: false,
      isProduction: false,
    },
  });

  // Duitku form
  const duitkuForm = useForm<z.infer<typeof duitkuSchema>>({
    resolver: zodResolver(duitkuSchema),
    defaultValues: {
      merchantCode: "",
      apiKey: "",
      enabled: false,
      isProduction: false,
    },
  });

  const onSubmitMidtrans = (values: z.infer<typeof midtransSchema>) => {
    console.log(values);
    toast.success("Pengaturan Midtrans berhasil disimpan", {
      description: "Konfigurasi payment gateway Midtrans telah diperbarui.",
      action: {
        label: "Tutup",
        onClick: () => {},
      },
    });
  };

  const onSubmitDuitku = (values: z.infer<typeof duitkuSchema>) => {
    console.log(values);
    toast.success("Pengaturan Duitku berhasil disimpan", {
      description: "Konfigurasi payment gateway Duitku telah diperbarui.",
      action: {
        label: "Tutup",
        onClick: () => {},
      },
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Payment Gateway</CardTitle>
          <CardDescription>
            Konfigurasi payment gateway untuk memudahkan pelanggan membayar tagihan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="midtrans" onValueChange={setActiveGateway} value={activeGateway}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="midtrans">Midtrans</TabsTrigger>
              <TabsTrigger value="duitku">Duitku</TabsTrigger>
            </TabsList>
            
            <TabsContent value="midtrans">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-white p-2">
                  <img
                    src="https://storage.googleapis.com/midtrans-production/uploads/header-logo/1680829742.svg"
                    alt="Midtrans Logo"
                    className="h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Midtrans</h3>
                  <p className="text-sm text-muted-foreground">
                    Integrasi dengan Midtrans untuk berbagai metode pembayaran
                  </p>
                </div>
              </div>
              
              <Form {...midtransForm}>
                <form onSubmit={midtransForm.handleSubmit(onSubmitMidtrans)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={midtransForm.control}
                      name="clientKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Key</FormLabel>
                          <FormControl>
                            <Input placeholder="SB-Mid-client-xxxxxx" {...field} />
                          </FormControl>
                          <FormDescription>
                            Dapatkan dari dashboard Midtrans Anda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={midtransForm.control}
                      name="serverKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Server Key</FormLabel>
                          <FormControl>
                            <Input placeholder="SB-Mid-server-xxxxxx" {...field} />
                          </FormControl>
                          <FormDescription>
                            Digunakan untuk verifikasi pembayaran
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={midtransForm.control}
                      name="merchantId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merchant ID</FormLabel>
                          <FormControl>
                            <Input placeholder="G123456789" {...field} />
                          </FormControl>
                          <FormDescription>
                            ID merchant Midtrans Anda
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <FormField
                      control={midtransForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4 w-full md:w-1/2">
                          <div>
                            <FormLabel>Aktifkan Midtrans</FormLabel>
                            <FormDescription>
                              Gunakan Midtrans sebagai payment gateway
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={midtransForm.control}
                      name="isProduction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4 w-full md:w-1/2">
                          <div>
                            <FormLabel>Mode Produksi</FormLabel>
                            <FormDescription>
                              Aktifkan untuk transaksi sebenarnya
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                        <span className="text-sm">Support Virtual Account, E-wallet, QRIS, dan Kartu Kredit</span>
                      </div>
                    </div>
                    <Button type="submit">Simpan Pengaturan</Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
            
            <TabsContent value="duitku">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border bg-white p-2">
                  <img
                    src="https://duitku.com/wp-content/uploads/2022/04/Logo-duitku-300x104.png"
                    alt="Duitku Logo"
                    className="h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Duitku</h3>
                  <p className="text-sm text-muted-foreground">
                    Integrasi dengan Duitku untuk berbagai metode pembayaran
                  </p>
                </div>
              </div>
              
              <Form {...duitkuForm}>
                <form onSubmit={duitkuForm.handleSubmit(onSubmitDuitku)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={duitkuForm.control}
                      name="merchantCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Merchant Code</FormLabel>
                          <FormControl>
                            <Input placeholder="D00001" {...field} />
                          </FormControl>
                          <FormDescription>
                            Kode merchant dari dashboard Duitku
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={duitkuForm.control}
                      name="apiKey"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>API Key</FormLabel>
                          <FormControl>
                            <Input placeholder="abcdef123456" {...field} />
                          </FormControl>
                          <FormDescription>
                            API Key dari dashboard Duitku
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <FormField
                      control={duitkuForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4 w-full md:w-1/2">
                          <div>
                            <FormLabel>Aktifkan Duitku</FormLabel>
                            <FormDescription>
                              Gunakan Duitku sebagai payment gateway
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={duitkuForm.control}
                      name="isProduction"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4 w-full md:w-1/2">
                          <div>
                            <FormLabel>Mode Produksi</FormLabel>
                            <FormDescription>
                              Aktifkan untuk transaksi sebenarnya
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="flex items-center justify-end space-x-2">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <CheckCircle2 className="text-green-500 h-5 w-5" />
                        <span className="text-sm">Support QRIS, Bank Transfer, dan e-wallet</span>
                      </div>
                    </div>
                    <Button type="submit">Simpan Pengaturan</Button>
                  </div>
                </form>
              </Form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Metode Pembayaran</CardTitle>
          <CardDescription>
            Kelola metode pembayaran yang tersedia untuk pelanggan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-1 bg-blue-100">
                  <CreditCard className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Virtual Account</p>
                  <p className="text-xs text-muted-foreground">
                    BCA, BRI, Mandiri, BNI
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-1 bg-green-100">
                  <CreditCard className="h-5 w-5 text-green-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">QRIS</p>
                  <p className="text-xs text-muted-foreground">
                    GoPay, OVO, DANA, LinkAja, ShopeePay
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-1 bg-yellow-100">
                  <CreditCardIcon className="h-5 w-5 text-yellow-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">Kartu Kredit</p>
                  <p className="text-xs text-muted-foreground">
                    Visa, Mastercard, JCB
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between space-x-4 rounded-lg border p-4">
              <div className="flex items-center space-x-4">
                <div className="rounded-full p-1 bg-purple-100">
                  <CreditCard className="h-5 w-5 text-purple-700" />
                </div>
                <div>
                  <p className="text-sm font-medium">E-Wallet</p>
                  <p className="text-xs text-muted-foreground">
                    GoPay, OVO, DANA, LinkAja
                  </p>
                </div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button variant="outline" className="mr-2">Atur Ulang</Button>
          <Button onClick={() => toast.success("Pengaturan metode pembayaran berhasil disimpan")}>
            Simpan Pengaturan
          </Button>
        </CardFooter>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Pengaturan Umum Pembayaran</CardTitle>
          <CardDescription>
            Konfigurasi pengaturan umum untuk sistem pembayaran
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Kirim Notifikasi Pembayaran</p>
                <p className="text-xs text-muted-foreground">
                  Kirim notifikasi via WhatsApp/SMS saat pembayaran berhasil
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Terima Pembayaran Manual</p>
                <p className="text-xs text-muted-foreground">
                  Izinkan pelanggan melakukan pembayaran secara manual
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Pengingat Pembayaran</p>
                <p className="text-xs text-muted-foreground">
                  Kirim pengingat otomatis untuk pembayaran yang belum lunas
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex flex-row items-center justify-between gap-2 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">Izinkan Pembayaran Cicilan</p>
                <p className="text-xs text-muted-foreground">
                  Izinkan pelanggan membayar dalam beberapa kali cicilan
                </p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => toast.success("Pengaturan umum pembayaran berhasil disimpan")}>
            Simpan Pengaturan
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
