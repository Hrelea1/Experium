import { useState } from "react";
import { motion } from "framer-motion";
import { Users, CreditCard, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface BookingFormProps {
  experience: {
    id: string; // UUID from database
    title: string;
    price: number;
    originalPrice?: number;
    maxParticipants: number;
  };
}

export function BookingForm({ experience }: BookingFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = experience.price * participants;
  const savings = experience.originalPrice 
    ? (experience.originalPrice - experience.price) * participants 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Autentificare necesară",
        description: "Trebuie să fii autentificat pentru a adăuga în coș.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Create a voucher for the experience
      const { data: voucherData, error: voucherError } = await supabase.functions.invoke('create-voucher', {
        body: {
          experienceId: experience.id,
          validityMonths: 12
        }
      });

      if (voucherError) throw voucherError;

      // Assign voucher to user
      const { error: updateError } = await supabase
        .from('vouchers')
        .update({ 
          user_id: user.id,
        })
        .eq('id', voucherData.voucher.id);

      if (updateError) {
        console.error('Failed to update voucher:', updateError);
      }

      toast({
        title: "Adăugat în coș! 🎉",
        description: `${experience.title} a fost adăugat în coș. Poți alege data după verificarea codului voucher.`,
      });

      // Navigate to cart
      setTimeout(() => {
        navigate("/cart");
      }, 1500);

    } catch (error: any) {
      console.error('Error:', error);
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-card rounded-2xl shadow-xl border border-border/50 overflow-hidden"
    >
      {/* Price Header */}
      <div className="bg-gradient-to-r from-primary to-coral-dark p-6 text-primary-foreground">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold">{experience.price} lei</span>
          {experience.originalPrice && (
            <span className="text-primary-foreground/70 line-through text-lg">
              {experience.originalPrice} lei
            </span>
          )}
          <span className="text-primary-foreground/80">/ persoană</span>
        </div>
        {savings > 0 && (
          <p className="text-primary-foreground/90 text-sm mt-1">
            Economisești {savings} lei la această comandă!
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Participants */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Users className="w-4 h-4 text-primary" />
            Număr persoane
          </label>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setParticipants(Math.max(1, participants - 1))}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors text-xl font-medium"
            >
              −
            </button>
            <span className="w-12 text-center text-lg font-semibold text-foreground">
              {participants}
            </span>
            <button
              type="button"
              onClick={() => setParticipants(Math.min(experience.maxParticipants, participants + 1))}
              className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground hover:bg-muted/80 transition-colors text-xl font-medium"
            >
              +
            </button>
            <span className="text-sm text-muted-foreground ml-2">
              (max {experience.maxParticipants})
            </span>
          </div>
        </div>

        {/* Info about date selection */}
        <div className="bg-muted/50 rounded-xl p-4">
          <p className="text-sm text-muted-foreground">
            📅 Data experienței se selectează după achiziție, când folosești codul voucher.
          </p>
        </div>

        {/* Total */}
        <div className="border-t border-border pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-muted-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">{totalPrice} lei</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button 
          type="submit" 
          size="xl" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
              />
              Se procesează...
            </span>
          ) : (
            <>
              <ShoppingBag className="w-5 h-5 mr-2" />
              Adaugă în Coș
            </>
          )}
        </Button>

        {/* Security Note */}
        <p className="text-center text-xs text-muted-foreground">
          🔒 Plată securizată • Voucher valabil 12 luni
        </p>
      </form>
    </motion.div>
  );
}
