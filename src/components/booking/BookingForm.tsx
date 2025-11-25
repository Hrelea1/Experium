import { useState } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { CalendarIcon, Users, Gift, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [participants, setParticipants] = useState(1);
  const [isGift, setIsGift] = useState(false);
  const [giftDetails, setGiftDetails] = useState({
    recipientName: "",
    recipientEmail: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const totalPrice = experience.price * participants;
  const savings = experience.originalPrice 
    ? (experience.originalPrice - experience.price) * participants 
    : 0;

  // Disable dates in the past and some random unavailable dates
  const disabledDays = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable past dates
    if (date < today) return true;
    
    // Disable dates within next 2 days (preparation time)
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 2);
    if (date < minDate) return true;
    
    // Simulate some unavailable dates (every Sunday and some random dates)
    if (date.getDay() === 0) return true;
    
    return false;
  };

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
      description: `Ai rezervat ${experience.title} pentru ${participants} ${participants === 1 ? "persoană" : "persoane"} pe ${format(selectedDate, "d MMMM yyyy", { locale: ro })}.`,
    });
    
    setIsSubmitting(false);
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
            Economisești {savings} lei la această rezervare!
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Date Selection with Calendar */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
            <CalendarIcon className="w-4 h-4 text-primary" />
            Data experienței
          </label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal h-12 rounded-xl bg-muted border-0 hover:bg-muted/80",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                {selectedDate ? (
                  format(selectedDate, "EEEE, d MMMM yyyy", { locale: ro })
                ) : (
                  <span>Selectează o dată</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-card border border-border shadow-xl z-50" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }}
                disabled={disabledDays}
                initialFocus
                locale={ro}
                className={cn("p-3 pointer-events-auto")}
              />
              <div className="px-4 pb-3 pt-0">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-muted"></span>
                  Indisponibil
                </p>
              </div>
            </PopoverContent>
          </Popover>
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
