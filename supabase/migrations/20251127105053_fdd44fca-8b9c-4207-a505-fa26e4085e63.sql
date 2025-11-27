-- Make user_id nullable on vouchers table so vouchers can be unassigned initially
ALTER TABLE public.vouchers 
ALTER COLUMN user_id DROP NOT NULL;

-- Update validate_voucher_code to allow any user to validate unassigned vouchers
CREATE OR REPLACE FUNCTION public.validate_voucher_code(voucher_code text)
RETURNS TABLE(voucher_id uuid, experience_id uuid, is_valid boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record RECORD;
BEGIN
  -- Check if voucher exists
  SELECT * INTO v_record
  FROM public.vouchers
  WHERE code = voucher_code;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::UUID, 
      FALSE, 
      'Codul voucher-ului este invalid'::TEXT;
    RETURN;
  END IF;

  -- Check if voucher is active
  IF v_record.status != 'active' THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::UUID, 
      FALSE, 
      'Acest voucher a fost deja folosit sau este expirat'::TEXT;
    RETURN;
  END IF;

  -- Check if voucher is expired
  IF v_record.expiry_date < now() THEN
    UPDATE public.vouchers 
    SET status = 'expired' 
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::UUID, 
      FALSE, 
      'Acest voucher a expirat'::TEXT;
    RETURN;
  END IF;

  -- Check if voucher is already assigned to a different user
  IF v_record.user_id IS NOT NULL AND v_record.user_id != auth.uid() THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::UUID, 
      FALSE, 
      'Acest voucher a fost deja atribuit altui utilizator'::TEXT;
    RETURN;
  END IF;

  -- Voucher is valid
  RETURN QUERY SELECT 
    v_record.id, 
    v_record.experience_id, 
    TRUE, 
    NULL::TEXT;
END;
$function$;

-- Update redeem_voucher to assign user_id on first redemption
CREATE OR REPLACE FUNCTION public.redeem_voucher(p_voucher_id uuid, p_booking_date timestamp with time zone, p_participants integer DEFAULT 1, p_special_requests text DEFAULT NULL::text)
RETURNS TABLE(booking_id uuid, success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_record RECORD;
  v_experience RECORD;
  v_booking_id UUID;
BEGIN
  -- Get voucher details
  SELECT * INTO v_record
  FROM public.vouchers
  WHERE id = p_voucher_id 
    AND (user_id IS NULL OR user_id = auth.uid());

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      FALSE, 
      'Voucher-ul nu a fost găsit sau a fost deja atribuit altui utilizator'::TEXT;
    RETURN;
  END IF;

  -- Validate voucher status
  IF v_record.status != 'active' THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      FALSE, 
      'Acest voucher nu poate fi folosit'::TEXT;
    RETURN;
  END IF;

  -- Get experience details
  SELECT * INTO v_experience
  FROM public.experiences
  WHERE id = v_record.experience_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      FALSE, 
      'Experiența nu a fost găsită'::TEXT;
    RETURN;
  END IF;

  -- Assign voucher to current user if not already assigned
  IF v_record.user_id IS NULL THEN
    UPDATE public.vouchers
    SET user_id = auth.uid()
    WHERE id = p_voucher_id;
  END IF;

  -- Create booking
  INSERT INTO public.bookings (
    user_id,
    experience_id,
    voucher_id,
    booking_date,
    participants,
    total_price,
    payment_method,
    special_requests,
    status
  ) VALUES (
    auth.uid(),
    v_record.experience_id,
    p_voucher_id,
    p_booking_date,
    p_participants,
    v_record.purchase_price,
    'voucher',
    p_special_requests,
    'confirmed'
  )
  RETURNING id INTO v_booking_id;

  -- Update voucher status
  UPDATE public.vouchers
  SET 
    status = 'used',
    redemption_date = now()
  WHERE id = p_voucher_id;

  -- Return success
  RETURN QUERY SELECT 
    v_booking_id, 
    TRUE, 
    NULL::TEXT;
END;
$function$;

-- Update RLS policies to allow unassigned vouchers
DROP POLICY IF EXISTS "Users can view their own vouchers" ON public.vouchers;
DROP POLICY IF EXISTS "Admins can view all vouchers" ON public.vouchers;

CREATE POLICY "Users can view their own vouchers or unassigned vouchers"
ON public.vouchers
FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL OR is_admin());

CREATE POLICY "Admins can insert vouchers"
ON public.vouchers
FOR INSERT
WITH CHECK (is_admin());