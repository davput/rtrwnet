import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BillingOverview, InvoiceList, PlanSelector } from '@/components/billing';
import { CreditCard, FileText, Package } from 'lucide-react';

export default function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground">
          Kelola langganan dan lihat riwayat pembayaran
        </p>
      </div>

      <BillingOverview />

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Invoice
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Ubah Paket
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <InvoiceList />
        </TabsContent>

        <TabsContent value="plans">
          <PlanSelector />
        </TabsContent>
      </Tabs>
    </div>
  );
}
