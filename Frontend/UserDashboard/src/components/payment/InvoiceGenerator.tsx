
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

// Mock customers and packages data
const customers = [
  { id: "1", name: "Budi Santoso" },
  { id: "2", name: "Siti Rahayu" },
  { id: "3", name: "Ahmad Fauzi" },
  { id: "4", name: "Diana Putri" },
  { id: "5", name: "Eko Prasetyo" },
];

const packages = [
  { id: "1", name: "Paket 5 Mbps", price: 100000 },
  { id: "2", name: "Paket 10 Mbps", price: 150000 },
  { id: "3", name: "Paket 20 Mbps", price: 250000 },
  { id: "4", name: "Paket 30 Mbps", price: 350000 },
  { id: "5", name: "Paket 50 Mbps", price: 500000 },
];

// Form schema
const invoiceSchema = z.object({
  customerId: z.string().min(1, { message: "Pilih pelanggan" }),
  packageId: z.string().min(1, { message: "Pilih paket internet" }),
  amount: z.coerce.number().min(1, { message: "Jumlah harus lebih dari 0" }),
  description: z.string().optional(),
  dueDate: z.string().min(1, { message: "Tanggal jatuh tempo diperlukan" }),
});

export function InvoiceGenerator() {
  const [open, setOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const form = useForm<z.infer<typeof invoiceSchema>>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      customerId: "",
      packageId: "",
      amount: 0,
      description: "Pembayaran internet bulan " + new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString().split('T')[0],
    },
  });

  const onSubmit = (values: z.infer<typeof invoiceSchema>) => {
    console.log(values);
    toast.success("Invoice berhasil dibuat", {
      description: "Invoice telah dibuat dan dikirim ke pelanggan.",
    });
    setOpen(false);
    form.reset();
  };

  const handlePackageChange = (packageId: string) => {
    const selectedPkg = packages.find(pkg => pkg.id === packageId);
    if (selectedPkg) {
      setSelectedPackage(selectedPkg);
      form.setValue("amount", selectedPkg.price);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" />
          Buat Invoice Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Buat Invoice Baru</DialogTitle>
          <DialogDescription>
            Buat invoice baru untuk pelanggan RT/RW Net Anda
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pelanggan</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih pelanggan" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="packageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paket Internet</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handlePackageChange(value);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih paket" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - Rp {pkg.price.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormDescription>
                      Jumlah tagihan dalam Rupiah
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tanggal Jatuh Tempo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormDescription>
                      Tanggal terakhir pembayaran
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deskripsi</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormDescription>
                    Deskripsi tagihan atau catatan tambahan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Buat Invoice</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
