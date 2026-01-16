import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle, Clock, Copy, Check } from 'lucide-react';
import { paymentApi, PaymentMethod, InvoiceDetails, PaymentTokenResponse } from '@/api/payment.api';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  orderID: string;
  onPaymentSuccess?: () => void;
}

type PaymentStep = 'loading' | 'select-method' | 'payment-instructions' | 'checking-status' | 'success' | 'failed';

export function PaymentModal({ open, onClose, orderID, onPaymentSuccess }: PaymentModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<PaymentStep>('loading');
  const [invoice, setInvoice] = useState<InvoiceDetails | null>(null);
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [paymentData, setPaymentData] = useState<PaymentTokenResponse | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open && orderID) {
      loadInvoiceAndMethods();
    }
  }, [open, orderID]);

  const loadInvoiceAndMethods = async () => {
    try {
      setStep('loading');
      const [invoiceData, methodsData] = await Promise.all([
        paymentApi.getInvoiceDetails(orderID),
        paymentApi.getPaymentMethods(),
      ]);
      setInvoice(invoiceData);
      setMethods(methodsData);
      setStep('select-method');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Gagal memuat data pembayaran',
        variant: 'destructive',
      });
      onClose();
    }
  };

  const handleSelectMethod = async (methodId: string) => {
    try {
      setSelectedMethod(methodId);
      setStep('loading');
      
      const payment = await paymentApi.createPaymentToken(orderID, methodId);
      setPaymentData(payment);
      setStep('payment-instructions');
      
      // Start polling payment status
      startStatusPolling();
    } catc