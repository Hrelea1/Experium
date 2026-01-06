-- Drop and recreate functions with proper search_path

-- Drop functions that need signature changes
DROP FUNCTION IF EXISTS public.cancel_booking(uuid, text);
DROP FUNCTION IF EXISTS public.redeem_voucher(uuid, timestamp with time zone, integer, text);
DROP FUNCTION IF EXISTS public.reschedule_booking(uuid, timestamp with time zone);
DROP FUNCTION IF EXISTS public.validate_voucher_code(text);

-- 1. auto_grant_admin_to_primary
CREATE OR REPLACE FUNCTION public.auto_grant_admin_to_primary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;

-- 2. cancel_booking
CREATE FUNCTION public.cancel_booking(p_booking_id uuid, p_cancellation_reason text)
RETURNS TABLE(success boolean, refund_eligible boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
  v_hours_until_booking numeric;
BEGIN
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
      cancellation_reason = p_cancellation_reason,
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN QUERY SELECT true, v_hours_until_booking > 48, ''::text;
END;
$$;

-- 3. generate_voucher_code
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    SELECT EXISTS(SELECT 1 FROM public.vouchers WHERE code = new_code) INTO code_exists;
    EXIT WHEN NOT code_exists;
  END LOOP;
  RETURN new_code;
END;
$$;

-- 4. handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$;

-- 5. log_homepage_content_changes
CREATE OR REPLACE FUNCTION public.log_homepage_content_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.homepage_content_audit (content_id, section_key, old_content, new_content, changed_by)
  VALUES (NEW.id, NEW.section_key, OLD.content, NEW.content, auth.uid());
  RETURN NEW;
END;
$$;

-- 6. redeem_voucher
CREATE FUNCTION public.redeem_voucher(
  p_voucher_id uuid,
  p_booking_date timestamp with time zone,
  p_participants integer DEFAULT 1,
  p_special_requests text DEFAULT NULL
)
RETURNS TABLE(success boolean, booking_id uuid, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher RECORD;
  v_new_booking_id uuid;
BEGIN
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
  VALUES (auth.uid(), v_voucher.experience_id, p_booking_date, p_participants, v_voucher.purchase_price, p_voucher_id, p_special_requests)
  RETURNING id INTO v_new_booking_id;
  
  UPDATE public.vouchers SET status = 'used', redemption_date = NOW(), updated_at = NOW() WHERE id = p_voucher_id;
  
  RETURN QUERY SELECT true, v_new_booking_id, ''::text;
END;
$$;

-- 7. reschedule_booking
CREATE FUNCTION public.reschedule_booking(p_booking_id uuid, p_new_booking_date timestamp with time zone)
RETURNS TABLE(success boolean, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id AND user_id = auth.uid();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Booking not found or access denied'::text;
    RETURN;
  END IF;
  
  IF v_booking.rescheduled_count >= 2 THEN
    RETURN QUERY SELECT false, 'Maximum reschedule limit reached'::text;
    RETURN;
  END IF;
  
  UPDATE public.bookings 
  SET booking_date = p_new_booking_date,
      rescheduled_count = rescheduled_count + 1,
      updated_at = NOW()
  WHERE id = p_booking_id;
  
  RETURN QUERY SELECT true, ''::text;
END;
$$;

-- 8. track_homepage_content_creation
CREATE OR REPLACE FUNCTION public.track_homepage_content_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.homepage_content_audit (content_id, section_key, old_content, new_content, changed_by)
  VALUES (NEW.id, NEW.section_key, NULL, NEW.content, auth.uid());
  RETURN NEW;
END;
$$;

-- 9. track_homepage_content_update
CREATE OR REPLACE FUNCTION public.track_homepage_content_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO public.homepage_content_audit (content_id, section_key, old_content, new_content, changed_by)
    VALUES (NEW.id, NEW.section_key, OLD.content, NEW.content, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

-- 10. update_expired_vouchers
CREATE OR REPLACE FUNCTION public.update_expired_vouchers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vouchers 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' AND expiry_date < NOW();
END;
$$;

-- 11. update_homepage_content_updated_at
CREATE OR REPLACE FUNCTION public.update_homepage_content_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 12. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- 13. validate_voucher_code
CREATE FUNCTION public.validate_voucher_code(voucher_code text)
RETURNS TABLE(is_valid boolean, voucher_id uuid, experience_id uuid, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_voucher RECORD;
BEGIN
  SELECT * INTO v_voucher FROM public.vouchers WHERE code = voucher_code;
  
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
$$;