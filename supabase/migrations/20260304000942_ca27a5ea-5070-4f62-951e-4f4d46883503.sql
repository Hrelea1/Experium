
-- Atomic function to lock a slot for a user (5 min timeout)
CREATE OR REPLACE FUNCTION public.lock_availability_slot(p_slot_id uuid, p_user_id uuid)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slot RECORD;
BEGIN
  -- Get slot with row lock
  SELECT * INTO v_slot FROM public.availability_slots WHERE id = p_slot_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Slot not found'::text;
    RETURN;
  END IF;
  
  IF v_slot.is_available = false THEN
    RETURN QUERY SELECT false, 'Slot is no longer available'::text;
    RETURN;
  END IF;
  
  -- Check if locked by someone else and lock hasn't expired
  IF v_slot.is_locked = true AND v_slot.locked_by != p_user_id AND v_slot.locked_until > NOW() THEN
    RETURN QUERY SELECT false, 'Slot is temporarily reserved by another user'::text;
    RETURN;
  END IF;
  
  -- Lock the slot for 5 minutes
  UPDATE public.availability_slots
  SET is_locked = true,
      locked_by = p_user_id,
      locked_until = NOW() + INTERVAL '5 minutes',
      updated_at = NOW()
  WHERE id = p_slot_id;
  
  RETURN QUERY SELECT true, ''::text;
END;
$$;

-- Unlock a slot (only by the user who locked it)
CREATE OR REPLACE FUNCTION public.unlock_availability_slot(p_slot_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.availability_slots
  SET is_locked = false,
      locked_by = NULL,
      locked_until = NULL,
      updated_at = NOW()
  WHERE id = p_slot_id AND locked_by = p_user_id;
END;
$$;

-- Confirm booking: decrements available capacity and creates booking
CREATE OR REPLACE FUNCTION public.confirm_slot_booking(
  p_slot_id uuid, 
  p_user_id uuid, 
  p_participants integer,
  p_total_price numeric,
  p_payment_method text DEFAULT NULL,
  p_special_requests text DEFAULT NULL
)
RETURNS TABLE(success boolean, booking_id uuid, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_slot RECORD;
  v_new_booking_id uuid;
  v_remaining integer;
BEGIN
  SELECT * INTO v_slot FROM public.availability_slots WHERE id = p_slot_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Slot not found'::text;
    RETURN;
  END IF;
  
  -- Verify lock ownership
  IF v_slot.is_locked = true AND v_slot.locked_by != p_user_id THEN
    IF v_slot.locked_until > NOW() THEN
      RETURN QUERY SELECT false, NULL::uuid, 'Slot is reserved by another user'::text;
      RETURN;
    END IF;
  END IF;
  
  v_remaining := v_slot.max_participants - v_slot.booked_participants;
  
  IF p_participants > v_remaining THEN
    RETURN QUERY SELECT false, NULL::uuid, ('Only ' || v_remaining || ' spots remaining')::text;
    RETURN;
  END IF;
  
  -- Create booking
  INSERT INTO public.bookings (
    user_id, experience_id, booking_date, participants, total_price, 
    status, payment_method, special_requests
  )
  VALUES (
    p_user_id, v_slot.experience_id, 
    (v_slot.slot_date::text || ' ' || v_slot.start_time::text)::timestamptz,
    p_participants, p_total_price, 'confirmed', p_payment_method, p_special_requests
  )
  RETURNING id INTO v_new_booking_id;
  
  -- Update slot capacity
  UPDATE public.availability_slots
  SET booked_participants = booked_participants + p_participants,
      is_available = CASE WHEN (booked_participants + p_participants) >= max_participants THEN false ELSE true END,
      is_locked = false,
      locked_by = NULL,
      locked_until = NULL,
      updated_at = NOW()
  WHERE id = p_slot_id;
  
  RETURN QUERY SELECT true, v_new_booking_id, ''::text;
END;
$$;
