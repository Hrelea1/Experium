-- Update redeem_voucher function to add backend validation for special requests
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
  -- Validate special requests length (backend enforcement)
  IF p_special_requests IS NOT NULL AND LENGTH(p_special_requests) > 500 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Special requests exceeds maximum length of 500 characters'::text;
    RETURN;
  END IF;
  
  -- Validate participants
  IF p_participants < 1 OR p_participants > 100 THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Invalid number of participants (must be 1-100)'::text;
    RETURN;
  END IF;
  
  -- Validate booking date is in the future
  IF p_booking_date < NOW() THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Booking date must be in the future'::text;
    RETURN;
  END IF;
  
  -- Sanitize special requests - remove potential SQL injection characters and trim
  IF p_special_requests IS NOT NULL THEN
    v_sanitized_requests := TRIM(regexp_replace(p_special_requests, E'[\\x00-\\x1F]', '', 'g'));
  ELSE
    v_sanitized_requests := NULL;
  END IF;

  SELECT * INTO v_voucher FROM public.vouchers WHERE id = p_voucher_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 'Voucher not found'::text;
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

-- Also add validation to cancel_booking function for cancellation_reason
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id uuid, p_cancellation_reason text)
 RETURNS TABLE(success boolean, refund_eligible boolean, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_booking RECORD;
  v_hours_until_booking numeric;
  v_sanitized_reason text;
BEGIN
  -- Validate cancellation reason length
  IF p_cancellation_reason IS NOT NULL AND LENGTH(p_cancellation_reason) > 500 THEN
    RETURN QUERY SELECT false, false, 'Cancellation reason exceeds maximum length of 500 characters'::text;
    RETURN;
  END IF;
  
  -- Sanitize cancellation reason
  IF p_cancellation_reason IS NOT NULL THEN
    v_sanitized_reason := TRIM(regexp_replace(p_cancellation_reason, E'[\\x00-\\x1F]', '', 'g'));
  ELSE
    v_sanitized_reason := NULL;
  END IF;

  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 'Booking not found or access denied'::text;
    RETURN;
  END IF;
  
  IF v_booking.status = 'cancelled' THEN
    RETURN QUERY SELECT false, false, 'Booking is already cancelled'::text;
    RETURN;
  END IF;
  
  v_hours_until_booking := EXTRACT(EPOCH FROM (v_booking.booking_date - NOW())) / 3600;
  
  UPDATE public.bookings 
  SET status = 'cancelled',
      cancellation_date = NOW(),
      cancellation_reason = v_sanitized_reason,
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN QUERY SELECT true, v_hours_until_booking > 48, ''::text;
END;
$function$;