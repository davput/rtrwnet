import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateTicket } from '@/hooks/useTickets';
import { useCustomers } from '@/hooks/useCustomers';
import { toast } from 'sonner';
import { ArrowLeft, Loader2 } from 'lucide-react';

const ticketSchema = z.object({
  customer_id: z.string().min(1, 'Pilih pelanggan'),
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  description: z.string().min(10, 'Deskripsi minimal 10 karakter'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
});

type TicketFormData = z.infer<typeof ticketSchema>;

export function TicketForm() {
  const navigate = useNavigate();
  const createTicket = useCreateTicket();
  const { data: customersData, isLoading: loadingCustomers } = useCustomers({ per_page: 100 });

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: {
      customer_id: '',
      title: '',
      description: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (data: TicketFormData) => {
    try {
      await createTicket.mutateAsync(data);
      toast.success('Tiket berhasil dibuat');
      navigate('/tiket');
    } catch {
      toast.error('Gagal membuat tiket');
    }
  };

  const customers = customersData?.data?.customers || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tiket')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Tiket Baru</h1>
          <p className="text-muted-foreground">Buat tiket support untuk pelanggan</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Detail Tiket</CardTitle>
          <CardDescription>Isi informasi tiket support</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="customer_id"
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
                        {loadingCustomers ? (
                          <SelectItem value="" disabled>
                            Memuat...
                          </SelectItem>
                        ) : (
                          customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.customer_code} - {customer.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan judul tiket" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioritas</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Rendah</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Jelaskan masalah yang dialami pelanggan..."
                        rows={5}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate('/tiket')}>
                  Batal
                </Button>
                <Button type="submit" disabled={createTicket.isPending}>
                  {createTicket.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Buat Tiket
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export default TicketForm;
