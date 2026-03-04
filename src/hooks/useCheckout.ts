import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface BookingCheckoutParams {
  experienceId: string;
  slotId: string;
  participants: number;
  totalPrice: number;
  title: string;
}

export function useCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processCheckout = async (params: BookingCheckoutParams): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Eroare',
        description: 'Trebuie să fii autentificat pentru a finaliza plata',
        variant: 'destructive',
      });
      return false;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          ...params,
          returnUrl: window.location.origin + window.location.pathname,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      const stripeWindow = window.open(data.url, '_blank');
      if (!stripeWindow) {
        window.location.href = data.url;
      }
      setIsProcessing(false);
      return true;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Eroare la procesarea plății',
        description: error.message || 'Te rugăm să încerci din nou',
        variant: 'destructive',
      });
      setIsProcessing(false);
      return false;
    }
  };

  return {
    processCheckout,
    isProcessing,
  };
}
