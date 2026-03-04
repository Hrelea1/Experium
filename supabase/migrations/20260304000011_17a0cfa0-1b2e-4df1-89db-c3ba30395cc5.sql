
-- Add provider_type enum
CREATE TYPE public.provider_type AS ENUM ('accommodation', 'service');

-- Add provider_type and cancellation_policy to experiences
ALTER TABLE public.experiences 
ADD COLUMN provider_type public.provider_type NOT NULL DEFAULT 'service',
ADD COLUMN cancellation_policy text;

-- Add slot_type to availability_slots for accommodation (night) vs service (hour)
ALTER TABLE public.availability_slots
ADD COLUMN slot_type public.provider_type NOT NULL DEFAULT 'service',
ADD COLUMN is_locked boolean DEFAULT false,
ADD COLUMN locked_until timestamp with time zone,
ADD COLUMN locked_by uuid;

-- Create provider_recurring_availability table for recurrence patterns
CREATE TABLE public.provider_recurring_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  provider_user_id uuid NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  max_participants integer DEFAULT 10,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(experience_id, day_of_week, start_time)
);

-- Enable RLS on recurring availability
ALTER TABLE public.provider_recurring_availability ENABLE ROW LEVEL SECURITY;

-- RLS policies for recurring availability
CREATE POLICY "Providers can manage their own recurring availability"
ON public.provider_recurring_availability FOR ALL
USING (provider_user_id = auth.uid())
WITH CHECK (provider_user_id = auth.uid());

CREATE POLICY "Admins can manage all recurring availability"
ON public.provider_recurring_availability FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Public can view active recurring availability"
ON public.provider_recurring_availability FOR SELECT
USING (is_active = true);

-- Allow providers to also insert experiences they create
CREATE POLICY "Providers can insert their own experiences"
ON public.experiences FOR INSERT
WITH CHECK (has_role(auth.uid(), 'provider'::app_role));

CREATE POLICY "Providers can update their assigned experiences"
ON public.experiences FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM experience_providers ep
    WHERE ep.experience_id = experiences.id
    AND ep.provider_user_id = auth.uid()
    AND ep.is_active = true
  )
);

CREATE POLICY "Providers can view their assigned experiences"
ON public.experiences FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM experience_providers ep
    WHERE ep.experience_id = experiences.id
    AND ep.provider_user_id = auth.uid()
    AND ep.is_active = true
  )
);

-- Providers can view bookings for their experiences
CREATE POLICY "Providers can view bookings for their experiences"
ON public.bookings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM experience_providers ep
    WHERE ep.experience_id = bookings.experience_id
    AND ep.provider_user_id = auth.uid()
    AND ep.is_active = true
  )
);

-- Function to generate availability slots from recurring patterns
CREATE OR REPLACE FUNCTION public.generate_slots_from_recurring(
  p_experience_id uuid,
  p_provider_user_id uuid,
  p_start_date date,
  p_end_date date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_recurring RECORD;
  v_current_date date;
  v_count integer := 0;
BEGIN
  FOR v_recurring IN
    SELECT * FROM public.provider_recurring_availability
    WHERE experience_id = p_experience_id
    AND provider_user_id = p_provider_user_id
    AND is_active = true
  LOOP
    v_current_date := p_start_date;
    WHILE v_current_date <= p_end_date LOOP
      IF EXTRACT(DOW FROM v_current_date) = v_recurring.day_of_week THEN
        INSERT INTO public.availability_slots (
          experience_id, provider_user_id, slot_date, start_time, end_time, 
          max_participants, is_available, slot_type
        )
        VALUES (
          p_experience_id, p_provider_user_id, v_current_date,
          v_recurring.start_time, v_recurring.end_time,
          v_recurring.max_participants, true,
          (SELECT provider_type FROM experiences WHERE id = p_experience_id)
        )
        ON CONFLICT DO NOTHING;
        v_count := v_count + 1;
      END IF;
      v_current_date := v_current_date + 1;
    END LOOP;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Enable realtime for availability_slots
ALTER PUBLICATION supabase_realtime ADD TABLE public.availability_slots;
