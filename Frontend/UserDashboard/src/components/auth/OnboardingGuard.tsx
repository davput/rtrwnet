import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '@/api/axios';
import { Loader2 } from 'lucide-react';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

// Routes yang tidak perlu onboarding check
const EXEMPT_ROUTES = [
  '/setup',
  '/billing',
  '/pengaturan',
  '/akun-settings',
  '/subscription-required',
];

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    try {
      const response = await api.get('/onboarding/status');
      console.log('Onboarding status response:', response.data);
      
      // Handle different response structures
      const data = response.data?.data || response.data;
      const completed = data?.completed ?? false;
      
      console.log('Onboarding completed:', completed);
      
      // If onboarding not completed, need to redirect
      setNeedsOnboarding(!completed);
    } catch (error: any) {
      console.error('Failed to check onboarding:', error);
      console.error('Error response:', error?.response?.data);
      
      // If 404 or endpoint not found, assume needs onboarding
      if (error?.response?.status === 404) {
        setNeedsOnboarding(true);
      } else {
        // On other errors, assume onboarding is complete to avoid blocking
        setNeedsOnboarding(false);
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
          <p className="mt-2 text-muted-foreground">Memeriksa setup...</p>
        </div>
      </div>
    );
  }

  // Check if current route is exempt
  const isExemptRoute = EXEMPT_ROUTES.some(route => location.pathname.startsWith(route));
  
  console.log('OnboardingGuard - needsOnboarding:', needsOnboarding, 'isExemptRoute:', isExemptRoute, 'path:', location.pathname);
  
  // If needs onboarding and not on exempt route, redirect to setup
  if (needsOnboarding && !isExemptRoute) {
    console.log('Redirecting to /setup');
    return <Navigate to="/setup" replace />;
  }

  return <>{children}</>;
}
