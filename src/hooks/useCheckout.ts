import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CartItem, DeliveryType, PersonalDetails, DeliveryAddress } from '@/contexts/CartContext';

export function useCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processCheckout = async (
    items: CartItem[],
    deliveryType: DeliveryType,
    personalDetails: PersonalDetails,
    deliveryAddress: DeliveryAddress | null
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Eroare',
        description: 'Trebuie să fii autentificat pentru a finaliza comanda',
        variant: 'destructive',
      });
      return false;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          items,
          deliveryType,
          personalDetails,
          deliveryAddress,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      // Redirect to Stripe Checkout
      window.location.href = data.url;
      return true;
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Eroare la procesarea comenzii',
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
