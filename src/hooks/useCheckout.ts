import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { CartItem, DeliveryType, PersonalDetails, DeliveryAddress } from '@/contexts/CartContext';

interface CheckoutResult {
  success: boolean;
  orderId: string;
  vouchers: Array<{
    id: string;
    code: string;
    experienceId: string;
    experienceTitle: string;
    price: number;
  }>;
}

export function useCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const processCheckout = async (
    items: CartItem[],
    deliveryType: DeliveryType,
    personalDetails: PersonalDetails,
    deliveryAddress: DeliveryAddress | null
  ): Promise<CheckoutResult | null> => {
    if (!user) {
      toast({
        title: 'Eroare',
        description: 'Trebuie să fii autentificat pentru a finaliza comanda',
        variant: 'destructive',
      });
      return null;
    }

    setIsProcessing(true);

    try {
      const orderId = `ORD-${Date.now().toString(36).toUpperCase()}`;
      const vouchers: CheckoutResult['vouchers'] = [];

      // Create vouchers for each cart item
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          // Generate unique voucher code
          const { data: codeData, error: codeError } = await supabase
            .rpc('generate_voucher_code');
          
          if (codeError) throw codeError;
          
          const voucherCode = codeData as string;
          
          // Calculate total price including services
          const servicesTotal = item.services?.reduce((sum, s) => sum + s.price * s.quantity, 0) || 0;
          const totalPrice = item.price + servicesTotal;

          // Get experience ambassador_id if exists
          const { data: expData } = await supabase
            .from('experiences')
            .select('ambassador_id')
            .eq('id', item.id.split('-')[0]) // Extract original experience ID
            .single();

          // Create voucher in database
          const { data: voucherData, error: voucherError } = await supabase
            .from('vouchers')
            .insert({
              code: voucherCode,
              user_id: user.id,
              experience_id: item.id.split('-')[0], // Extract original experience ID
              purchase_price: totalPrice,
              expiry_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
              status: 'active',
              notes: item.isGift ? 'Gift voucher' : null,
              ambassador_id: expData?.ambassador_id || null,
            })
            .select()
            .single();

          if (voucherError) throw voucherError;

          vouchers.push({
            id: voucherData.id,
            code: voucherCode,
            experienceId: item.id.split('-')[0],
            experienceTitle: item.title,
            price: totalPrice,
          });
        }
      }

      toast({
        title: 'Comandă finalizată!',
        description: `Ai achiziționat ${vouchers.length} voucher(e)`,
      });

      return {
        success: true,
        orderId,
        vouchers,
      };
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: 'Eroare la procesarea comenzii',
        description: error.message || 'Te rugăm să încerci din nou',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processCheckout,
    isProcessing,
  };
}
