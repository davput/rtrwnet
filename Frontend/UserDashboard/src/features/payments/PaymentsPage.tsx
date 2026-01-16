import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentTransactions } from "@/components/payment/PaymentTransactions";
import { PaymentSettings } from "@/components/payment/PaymentSettings";
import { CreditCard } from "lucide-react";

export function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("transactions");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <CreditCard className="h-6 w-6 text-rtwnet-600" />
        <h1 className="text-2xl font-bold tracking-tight">Pembayaran</h1>
      </div>
      
      <Tabs defaultValue="transactions" onValueChange={setActiveTab} value={activeTab}>
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="settings">Pengaturan</TabsTrigger>
        </TabsList>
        <TabsContent value="transactions" className="space-y-4 mt-6">
          <PaymentTransactions />
        </TabsContent>
        <TabsContent value="settings" className="space-y-4 mt-6">
          <PaymentSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PaymentsPage;
