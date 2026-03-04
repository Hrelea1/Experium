import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AvailabilitySlot {
  id: string;
  experience_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  booked_participants: number;
  is_available: boolean;
  is_locked: boolean;
  locked_by: string | null;
  locked_until: string | null;
  slot_type: string;
}

export function useAvailabilitySlots(experienceId: string) {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

  const fetchSlots = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("availability_slots")
      .select("*")
      .eq("experience_id", experienceId)
      .eq("is_available", true)
      .gte("slot_date", today)
      .order("slot_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (!error && data) {
      setSlots(data as AvailabilitySlot[]);
    }
    setLoading(false);
  }, [experienceId]);

  useEffect(() => {
    fetchSlots();

    // Realtime subscription
    const channel = supabase
      .channel(`slots-${experienceId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "availability_slots",
          filter: `experience_id=eq.${experienceId}`,
        },
        () => {
          fetchSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [experienceId, fetchSlots]);

  // Get unique available dates
  const availableDates = Array.from(
    new Set(slots.map((s) => s.slot_date))
  );

  // Get slots for selected date
  const slotsForDate = selectedDate
    ? slots.filter(
        (s) => s.slot_date === selectedDate.toISOString().split("T")[0]
      )
    : [];

  return {
    slots,
    loading,
    availableDates,
    selectedDate,
    setSelectedDate,
    slotsForDate,
    refetch: fetchSlots,
  };
}
