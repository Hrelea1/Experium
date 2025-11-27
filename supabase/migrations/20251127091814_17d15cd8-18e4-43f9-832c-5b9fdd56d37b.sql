-- Create booking status enum
CREATE TYPE public.booking_status AS ENUM ('pending', 'confirmed', 'cancelled', 'completed');

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE RESTRICT,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL,
  participants INTEGER NOT NULL DEFAULT 1,
  status public.booking_status NOT NULL DEFAULT 'confirmed',
  total_price NUMERIC NOT NULL,
  payment_method TEXT,
  special_requests TEXT,
  cancellation_date TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on bookings
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = user_id);

-- Create indexes for faster lookups
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_experience_id ON public.bookings(experience_id);
CREATE INDEX idx_bookings_voucher_id ON public.bookings(voucher_id);
CREATE INDEX idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);

-- Add trigger for updated_at on bookings
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to validate and use voucher
CREATE OR REPLACE FUNCTION public.validate_voucher_code(voucher_code TEXT)
RETURNS TABLE (
  voucher_id UUID,
  experience_id UUID,
  is_valid BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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

  -- Check if voucher belongs to current user
  IF v_record.user_id != auth.uid() THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      NULL::UUID, 
      FALSE, 
      'Acest voucher nu aparține contului tău'::TEXT;
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
    -- Update voucher status to expired
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

  -- Voucher is valid
  RETURN QUERY SELECT 
    v_record.id, 
    v_record.experience_id, 
    TRUE, 
    NULL::TEXT;
END;
$$;

-- Function to redeem voucher and create booking
CREATE OR REPLACE FUNCTION public.redeem_voucher(
  p_voucher_id UUID,
  p_booking_date TIMESTAMP WITH TIME ZONE,
  p_participants INTEGER DEFAULT 1,
  p_special_requests TEXT DEFAULT NULL
)
RETURNS TABLE (
  booking_id UUID,
  success BOOLEAN,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_experience RECORD;
  v_booking_id UUID;
BEGIN
  -- Get voucher details
  SELECT * INTO v_record
  FROM public.vouchers
  WHERE id = p_voucher_id AND user_id = auth.uid();

  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, 
      FALSE, 
      'Voucher-ul nu a fost găsit sau nu aparține contului tău'::TEXT;
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
$$;