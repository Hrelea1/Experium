-- Add rescheduled_count column to track rescheduling limit
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS rescheduled_count INTEGER NOT NULL DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN public.bookings.rescheduled_count IS 'Tracks how many times this booking has been rescheduled (max 1 allowed)';

-- Create function to cancel booking with 48-hour policy
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id UUID,
  p_cancellation_reason TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT,
  refund_eligible BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_hours_until_booking NUMERIC;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id 
    AND user_id = auth.uid()
    AND status IN ('confirmed', 'pending');

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Rezervarea nu a fost găsită sau nu poate fi anulată'::TEXT,
      FALSE;
    RETURN;
  END IF;

  -- Calculate hours until booking
  v_hours_until_booking := EXTRACT(EPOCH FROM (v_booking.booking_date - now())) / 3600;

  -- Update booking status
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancellation_date = now(),
    cancellation_reason = p_cancellation_reason,
    updated_at = now()
  WHERE id = p_booking_id;

  -- Return success with refund eligibility
  RETURN QUERY SELECT 
    TRUE, 
    NULL::TEXT,
    (v_hours_until_booking >= 48);
END;
$$;

-- Create function to reschedule booking with one-time policy
CREATE OR REPLACE FUNCTION public.reschedule_booking(
  p_booking_id UUID,
  p_new_booking_date TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_hours_until_booking NUMERIC;
BEGIN
  -- Get booking details
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id 
    AND user_id = auth.uid()
    AND status IN ('confirmed', 'pending');

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Rezervarea nu a fost găsită sau nu poate fi reprogramată'::TEXT;
    RETURN;
  END IF;

  -- Check if already rescheduled once
  IF v_booking.rescheduled_count >= 1 THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Ai atins limita de reprogramări pentru această rezervare'::TEXT;
    RETURN;
  END IF;

  -- Calculate hours until current booking
  v_hours_until_booking := EXTRACT(EPOCH FROM (v_booking.booking_date - now())) / 3600;

  -- Check 48-hour policy
  IF v_hours_until_booking < 48 THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Reprogramarea este posibilă doar cu minimum 48 de ore înainte de experiență'::TEXT;
    RETURN;
  END IF;

  -- Validate new date is in the future
  IF p_new_booking_date <= now() THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Data nouă trebuie să fie în viitor'::TEXT;
    RETURN;
  END IF;

  -- Update booking with new date
  UPDATE public.bookings
  SET 
    booking_date = p_new_booking_date,
    rescheduled_count = v_booking.rescheduled_count + 1,
    updated_at = now()
  WHERE id = p_booking_id;

  RETURN QUERY SELECT 
    TRUE, 
    NULL::TEXT;
END;
$$;