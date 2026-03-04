import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Lock, Loader2 } from "lucide-react";
import { useAvailabilitySlots, AvailabilitySlot } from "@/hooks/useAvailabilitySlots";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { ro } from "date-fns/locale";

interface SlotPickerProps {
  experienceId: string;
  participants: number;
  onSlotSelected: (slot: AvailabilitySlot | null) => void;
}

export function SlotPicker({ experienceId, participants, onSlotSelected }: SlotPickerProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { loading, availableDates, selectedDate, setSelectedDate, slotsForDate } =
    useAvailabilitySlots(experienceId);
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [locking, setLocking] = useState(false);

  // Unlock previous slot when selecting a new one or unmounting
  useEffect(() => {
    return () => {
      if (selectedSlot && user) {
        supabase.rpc("unlock_availability_slot", {
          p_slot_id: selectedSlot.id,
          p_user_id: user.id,
        });
      }
    };
  }, [selectedSlot, user]);

  const handleSlotClick = async (slot: AvailabilitySlot) => {
    if (!user) {
      toast({
        title: "Autentificare necesară",
        description: "Trebuie să fii autentificat pentru a rezerva.",
        variant: "destructive",
      });
      return;
    }

    const remaining = slot.max_participants - slot.booked_participants;
    if (participants > remaining) {
      toast({
        title: "Locuri insuficiente",
        description: `Doar ${remaining} locuri disponibile pentru acest slot.`,
        variant: "destructive",
      });
      return;
    }

    // Unlock previous slot
    if (selectedSlot && selectedSlot.id !== slot.id) {
      await supabase.rpc("unlock_availability_slot", {
        p_slot_id: selectedSlot.id,
        p_user_id: user.id,
      });
    }

    setLocking(true);
    const { data, error } = await supabase.rpc("lock_availability_slot", {
      p_slot_id: slot.id,
      p_user_id: user.id,
    });

    setLocking(false);

    if (error || !data || !data[0]?.success) {
      const msg = data?.[0]?.error_message || error?.message || "Nu s-a putut rezerva slotul.";
      toast({ title: "Slot indisponibil", description: msg, variant: "destructive" });
      setSelectedSlot(null);
      onSlotSelected(null);
      return;
    }

    setSelectedSlot(slot);
    onSlotSelected(slot);
    toast({ title: "Slot blocat", description: "Ai 5 minute pentru a finaliza rezervarea." });
  };

  // Dates that have available slots
  const enabledDates = availableDates.map((d) => new Date(d + "T00:00:00"));

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availableDates.includes(dateStr);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Se încarcă disponibilitatea...</span>
      </div>
    );
  }

  if (availableDates.length === 0) {
    return (
      <div className="text-center py-6 bg-muted/30 rounded-xl">
        <Clock className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Nu există sloturi disponibile momentan.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Calendar */}
      <div>
        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
          <Clock className="w-4 h-4 text-primary" />
          Alege data
        </label>
        <div className="border border-border rounded-xl p-1">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              setSelectedDate(date || undefined);
              setSelectedSlot(null);
              onSlotSelected(null);
            }}
            disabled={(date) => !isDateAvailable(date) || date < new Date()}
            locale={ro}
            className="rounded-xl"
          />
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && slotsForDate.length > 0 && (
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            Sloturi disponibile
          </label>
          <div className="grid grid-cols-2 gap-2">
            {slotsForDate.map((slot) => {
              const remaining = slot.max_participants - slot.booked_participants;
              const isSelected = selectedSlot?.id === slot.id;
              const isLockedByOther =
                slot.is_locked &&
                slot.locked_by !== user?.id &&
                slot.locked_until &&
                new Date(slot.locked_until) > new Date();

              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={isLockedByOther || locking || remaining < participants}
                  onClick={() => handleSlotClick(slot)}
                  className={cn(
                    "relative flex flex-col items-center p-3 rounded-xl border-2 transition-all text-sm",
                    isSelected
                      ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                      : "border-border hover:border-primary/50 bg-card",
                    (isLockedByOther || remaining < participants) &&
                      "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isLockedByOther && (
                    <Lock className="w-3 h-3 absolute top-1.5 right-1.5 text-muted-foreground" />
                  )}
                  <span className="font-semibold text-foreground">
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    <Users className="w-3 h-3" />
                    {remaining} locuri
                  </span>
                  {isSelected && (
                    <Badge variant="default" className="mt-1.5 text-xs">
                      Selectat
                    </Badge>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedDate && slotsForDate.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-3">
          Nu există sloturi pentru data selectată.
        </p>
      )}

      {locking && (
        <div className="flex items-center justify-center gap-2 text-sm text-primary">
          <Loader2 className="w-4 h-4 animate-spin" />
          Se blochează slotul...
        </div>
      )}
    </div>
  );
}
