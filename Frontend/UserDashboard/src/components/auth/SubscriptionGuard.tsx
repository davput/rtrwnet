import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { billingApi } from '@/api/billing.api';
import { Loader2 } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

// Status yang diizinkan untuk akses dashboard
const ALLOWED_STATUSES = ['trial', 'active'];

// Routes yang tidak perlu subscription check
const EXEMPT_ROUTES = ['/billing', '/pengaturan', '/akun-settings', '/subscription-required'];

export function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  useEffect(() => {
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const data = await billingApi.getDashboard();
      setSubscriptionStatus(data.subscription?.status || 'pending');
      
      // Jika pending, coba ambil order_id dari localStorage atau API
      if (data.subscription?.status === 'pending') {
        const storedOrderId = localStorage.getItem('pending_order_id');
        if (storedOrderId) {
          setOrderId(storedOrderId);
        }
      }
    } catch (error: any) {
      console.error('Failed to check subscription:', error);
      // Jika error 403 atau subscription tidak ada, set status pending
      if (error?.response?.status === 403 || error?.response?.status === 402) {
        setSubscriptionStatus('pending');
      } else {
        // Error lain, anggap pending untuk safety
        setSubscriptionStatus('pending');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Memeriksa status langganan...</p>
        </div>
      </div>
    );
  }

  // Check if current route is exempt
  const isExemptRoute = EXEMPT_ROUTES.some(route => location.pathname.startsWith(route));
  
  // If subscription is not active/trial and not on exempt route, redirect
  if (!ALLOWED_STATUSES.includes(subscriptionStatus || '') && !isExemptRoute) {
    // Redirect to subscription required page with order_id if available
    const redirectUrl = orderId 
      ? `/subscription-required?order_id=${orderId}`
      : '/subscription-required';
    return <Navigate to={redirectUrl} replace />;
  }

  return <>{children}</>;
}
