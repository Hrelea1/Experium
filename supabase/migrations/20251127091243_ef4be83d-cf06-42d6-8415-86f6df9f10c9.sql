-- Create voucher status enum
CREATE TYPE public.voucher_status AS ENUM ('active', 'used', 'expired', 'exchanged', 'transferred');

-- Create vouchers table
CREATE TABLE public.vouchers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_id UUID REFERENCES public.experiences(id) ON DELETE SET NULL,
  code TEXT NOT NULL UNIQUE,
  status public.voucher_status NOT NULL DEFAULT 'active',
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  redemption_date TIMESTAMP WITH TIME ZONE,
  purchase_price NUMERIC NOT NULL,
  qr_code_data TEXT,
  notes TEXT,
  transferred_to TEXT,
  transferred_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on vouchers
ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vouchers
CREATE POLICY "Users can view their own vouchers"
ON public.vouchers
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own vouchers"
ON public.vouchers
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own vouchers"
ON public.vouchers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_vouchers_user_id ON public.vouchers(user_id);
CREATE INDEX idx_vouchers_code ON public.vouchers(code);
CREATE INDEX idx_vouchers_status ON public.vouchers(status);

-- Add trigger for updated_at on vouchers
CREATE TRIGGER update_vouchers_updated_at
  BEFORE UPDATE ON public.vouchers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to generate unique voucher code
CREATE OR REPLACE FUNCTION public.generate_voucher_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate code in format: EXP-YYYY-XXXXXXXX
    new_code := 'EXP-' || 
                EXTRACT(YEAR FROM now())::TEXT || '-' ||
                upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.vouchers WHERE code = new_code) INTO code_exists;
    
    -- Exit loop if code is unique
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to check and update expired vouchers
CREATE OR REPLACE FUNCTION public.update_expired_vouchers()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.vouchers
  SET status = 'expired'
  WHERE status = 'active'
    AND expiry_date < now();
END;
$$;