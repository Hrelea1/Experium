import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Users, Gift, CreditCard, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface BookingFormProps {
  experience: {
    id: number;
    title: string;
    price: number;
    originalPrice?: number;
    maxParticipants: number;
  };
}

export function BookingForm({ experience }: BookingFormProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState("");
  const [participants, setParticipants] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftDetails, setGiftDetails] = useState({
    recipientName: "",
    recipientEmail: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalPrice = experience.price * participants;
  const savings = experience.originalPrice 
    ? (experience.originalPrice - experience.price) * participants 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDate) {
      toast({
        title: "Selectează o dată",
        description: "Te rugăm să alegi o dată pentru experiență.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Rezervare confirmată! 🎉",
      description: `Ai rezervat ${experience.title} pentru ${participants} ${participants === 1 ? "persoană" : "persoane"}.`,
    });
    
    setIsSubmitting(false);
  };

  // Generate available dates (next 30 days, excluding some random dates)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 3; i < 33; i++) {
      if (i % 7 !== 0 && i % 5 !== 0) { // Skip some dates
        const date = new Date(today);
        date.setDate(today.getDate() + i);
        dates.push(date);
      }
    }
    return dates;
  };

  const availableDates = getAvailableDates();

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
            Economisești {savings} lei la această rezervare!
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Date Selection */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <Calendar className="w-4 h-4 text-primary" />
            Data experienței
          </label>
          <div className="relative">
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-3 bg-muted rounded-xl text-foreground appearance-none cursor-pointer hover:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Selectează o dată</option>
              {availableDates.map((date, index) => (
                <option key={index} value={date.toISOString()}>
                  {date.toLocaleDateString("ro-RO", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

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

        {/* Gift Toggle */}
        <div className="bg-muted/50 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isGift}
              onChange={(e) => setIsGift(e.target.checked)}
              className="w-5 h-5 rounded border-border text-primary focus:ring-primary"
            />
            <div className="flex items-center gap-2">
              <Gift className="w-5 h-5 text-primary" />
              <span className="font-medium text-foreground">Oferă cadou</span>
            </div>
          </label>

          {/* Gift Details */}
          {isGift && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Numele destinatarului"
                value={giftDetails.recipientName}
                onChange={(e) => setGiftDetails({ ...giftDetails, recipientName: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <input
                type="email"
                placeholder="Email destinatar"
                value={giftDetails.recipientEmail}
                onChange={(e) => setGiftDetails({ ...giftDetails, recipientEmail: e.target.value })}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <textarea
                placeholder="Mesaj personal (opțional)"
                value={giftDetails.message}
                onChange={(e) => setGiftDetails({ ...giftDetails, message: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </motion.div>
          )}
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
              <CreditCard className="w-5 h-5 mr-2" />
              {isGift ? "Oferă Cadou" : "Rezervă Acum"}
            </>
          )}
        </Button>

        {/* Security Note */}
        <p className="text-center text-xs text-muted-foreground">
          🔒 Plată securizată • Anulare gratuită cu 48h înainte
        </p>
      </form>
    </motion.div>
  );
}
