-- Remove duplicate/conflicting voucher policy
DROP POLICY IF EXISTS "Users can view their own vouchers or unassigned vouchers" ON public.vouchers;

-- Create rate limits table for server-side rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  action_type text NOT NULL,
  attempt_count integer NOT NULL DEFAULT 1,
  first_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  last_attempt_at timestamp with time zone NOT NULL DEFAULT now(),
  blocked_until timestamp with time zone,
  UNIQUE(identifier, action_type)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access to rate_limits table
CREATE POLICY "No public access to rate limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_action 
ON public.rate_limits(identifier, action_type);

CREATE INDEX IF NOT EXISTS idx_rate_limits_blocked_until 
ON public.rate_limits(blocked_until) 
WHERE blocked_until IS NOT NULL;

-- Update check_rate_limit function with actual implementation
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_identifier text,
  p_action_type text DEFAULT 'default',
  p_max_attempts integer DEFAULT 5,
  p_window_minutes integer DEFAULT 15,
  p_block_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_record RECORD;
  v_window_start timestamp with time zone;
  v_now timestamp with time zone := now();
BEGIN
  v_window_start := v_now - (p_window_minutes || ' minutes')::interval;
  
  -- Check if blocked
  SELECT * INTO v_record 
  FROM public.rate_limits 
  WHERE identifier = p_identifier 
    AND action_type = p_action_type;
  
  IF FOUND THEN
    -- Check if currently blocked
    IF v_record.blocked_until IS NOT NULL AND v_record.blocked_until > v_now THEN
      RETURN false;
    END IF;
    
    -- Check if within window
    IF v_record.first_attempt_at > v_window_start THEN
      -- Within window, increment counter
      IF v_record.attempt_count >= p_max_attempts THEN
        -- Block the user
        UPDATE public.rate_limits 
        SET blocked_until = v_now + (p_block_minutes || ' minutes')::interval,
            last_attempt_at = v_now
        WHERE identifier = p_identifier AND action_type = p_action_type;
        RETURN false;
      ELSE
        -- Increment counter
        UPDATE public.rate_limits 
        SET attempt_count = attempt_count + 1,
            last_attempt_at = v_now
        WHERE identifier = p_identifier AND action_type = p_action_type;
        RETURN true;
      END IF;
    ELSE
      -- Outside window, reset counter
      UPDATE public.rate_limits 
      SET attempt_count = 1,
          first_attempt_at = v_now,
          last_attempt_at = v_now,
          blocked_until = NULL
      WHERE identifier = p_identifier AND action_type = p_action_type;
      RETURN true;
    END IF;
  ELSE
    -- First attempt, create record
    INSERT INTO public.rate_limits (identifier, action_type, attempt_count, first_attempt_at, last_attempt_at)
    VALUES (p_identifier, p_action_type, 1, v_now, v_now)
    ON CONFLICT (identifier, action_type) DO UPDATE
    SET attempt_count = 1, first_attempt_at = v_now, last_attempt_at = v_now, blocked_until = NULL;
    RETURN true;
  END IF;
END;
$$;

-- Cleanup function to remove old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE last_attempt_at < now() - interval '24 hours'
    AND (blocked_until IS NULL OR blocked_until < now());
END;
$$;