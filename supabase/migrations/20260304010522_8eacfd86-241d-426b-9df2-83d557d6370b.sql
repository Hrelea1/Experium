
-- 1. Fix validate_voucher_code: only allow validating vouchers assigned to the user or unassigned (for admin distribution)
CREATE OR REPLACE FUNCTION public.validate_voucher_code(voucher_code text)
 RETURNS TABLE(is_valid boolean, voucher_id uuid, experience_id uuid, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_voucher RECORD;
BEGIN
  -- Only allow validating vouchers that belong to the calling user
  SELECT * INTO v_voucher FROM public.vouchers 
  WHERE code = voucher_code 
    AND (user_id = auth.uid() OR (user_id IS NULL AND public.is_admin()));
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Invalid voucher code'::text;
    RETURN;
  END IF;
  
  IF v_voucher.status != 'active' THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Voucher is not active'::text;
    RETURN;
  END IF;
  
  IF v_voucher.expiry_date < NOW() THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::uuid, 'Voucher has expired'::text;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_voucher.id, v_voucher.experience_id, ''::text;
END;
$function$;

-- 2. Fix redeem_voucher: only allow redeeming vouchers assigned to the calling user
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_voucher_id uuid, p_booking_date timestamp with time zone, p_participants integer DEFAULT 1, p_special_requests text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, booking_id uuid, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_voucher RECORD;
  v_new_booking_id uuid;
  v_sanitized_requests text;
BEGIN
  IF p_special_requests IS NOT NULL AND LENGTH(p_special_requests) > 500 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Special requests exceeds maximum length of 500 characters'::text;
    RETURN;
  END IF;
  
  IF p_participants < 1 OR p_participants > 100 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Invalid number of participants (must be 1-100)'::text;
    RETURN;
  END IF;
  
  IF p_booking_date < NOW() THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Booking date must be in the future'::text;
    RETURN;
  END IF;
  
  IF p_special_requests IS NOT NULL THEN
    v_sanitized_requests := TRIM(regexp_replace(p_special_requests, E'[\\x00-\\x1F]', '', 'g'));
  ELSE
    v_sanitized_requests := NULL;
  END IF;

  -- SECURITY FIX: Only allow redeeming vouchers assigned to the calling user
  SELECT * INTO v_voucher FROM public.vouchers 
  WHERE id = p_voucher_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Voucher not found or not assigned to your account'::text;
    RETURN;
  END IF;
  
  IF v_voucher.status != 'active' THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Voucher is not active'::text;
    RETURN;
  END IF;
  
  IF v_voucher.expiry_date < NOW() THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Voucher has expired'::text;
    RETURN;
  END IF;
  
  INSERT INTO public.bookings (user_id, experience_id, booking_date, participants, total_price, voucher_id, special_requests)
  VALUES (auth.uid(), v_voucher.experience_id, p_booking_date, p_participants, v_voucher.purchase_price, p_voucher_id, v_sanitized_requests)
  RETURNING id INTO v_new_booking_id;
  
  UPDATE public.vouchers SET status = 'used', redemption_date = NOW(), updated_at = NOW() WHERE id = p_voucher_id;
  
  RETURN QUERY SELECT true, v_new_booking_id, ''::text;
END;
$function$;

-- 3. Fix confirm_slot_booking: add participant validation
CREATE OR REPLACE FUNCTION public.confirm_slot_booking(p_slot_id uuid, p_user_id uuid, p_participants integer, p_total_price numeric, p_payment_method text DEFAULT NULL::text, p_special_requests text DEFAULT NULL::text)
 RETURNS TABLE(success boolean, booking_id uuid, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_slot RECORD;
  v_new_booking_id uuid;
  v_remaining integer;
BEGIN
  -- SECURITY FIX: Validate participant count
  IF p_participants < 1 OR p_participants > 100 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Invalid number of participants (must be 1-100)'::text;
    RETURN;
  END IF;

  SELECT * INTO v_slot FROM public.availability_slots WHERE id = p_slot_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Slot not found'::text;
    RETURN;
  END IF;
  
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
$function$;

-- 4. Fix notification_logs RLS: remove overly permissive policy and replace with proper ones
DROP POLICY IF EXISTS "Service role can manage notifications" ON public.notification_logs;

-- Allow inserts only via service_role (edge functions use service role key)
CREATE POLICY "Service role can insert notifications"
  ON public.notification_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update notifications"
  ON public.notification_logs FOR UPDATE
  TO service_role
  USING (true);
