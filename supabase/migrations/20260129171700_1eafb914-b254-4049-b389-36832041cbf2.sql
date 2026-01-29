-- Table to link providers with experiences they manage
CREATE TABLE public.experience_providers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    provider_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    assigned_by uuid REFERENCES auth.users(id),
    assigned_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    UNIQUE(experience_id, provider_user_id)
);

-- Table to track experience ownership by ambassadors
CREATE TABLE public.experience_ambassadors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    ambassador_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(experience_id)
);

-- Table for provider availability slots
CREATE TABLE public.availability_slots (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
    provider_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slot_date date NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    max_participants integer DEFAULT 10,
    booked_participants integer DEFAULT 0,
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add ambassador_id to experiences table to track who created it
ALTER TABLE public.experiences ADD COLUMN IF NOT EXISTS ambassador_id uuid REFERENCES auth.users(id);

-- Add tracking columns to vouchers for sales attribution
ALTER TABLE public.vouchers ADD COLUMN IF NOT EXISTS ambassador_id uuid REFERENCES auth.users(id);

-- Enable RLS
ALTER TABLE public.experience_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_ambassadors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for experience_providers
CREATE POLICY "Admins can manage all experience providers"
ON public.experience_providers FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Ambassadors can view their experience providers"
ON public.experience_providers FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.experience_ambassadors ea
        WHERE ea.experience_id = experience_providers.experience_id
        AND ea.ambassador_user_id = auth.uid()
    )
);

CREATE POLICY "Ambassadors can assign providers to their experiences"
ON public.experience_providers FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.experience_ambassadors ea
        WHERE ea.experience_id = experience_providers.experience_id
        AND ea.ambassador_user_id = auth.uid()
    )
);

CREATE POLICY "Providers can view their own assignments"
ON public.experience_providers FOR SELECT
USING (provider_user_id = auth.uid());

-- RLS Policies for experience_ambassadors
CREATE POLICY "Admins can manage experience ambassadors"
ON public.experience_ambassadors FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Ambassadors can view their own experiences"
ON public.experience_ambassadors FOR SELECT
USING (ambassador_user_id = auth.uid());

CREATE POLICY "Ambassadors can create entries for their experiences"
ON public.experience_ambassadors FOR INSERT
WITH CHECK (
    ambassador_user_id = auth.uid() 
    AND has_role(auth.uid(), 'ambassador'::app_role)
);

-- RLS Policies for availability_slots
CREATE POLICY "Public can view available slots"
ON public.availability_slots FOR SELECT
USING (is_available = true);

CREATE POLICY "Admins can manage all slots"
ON public.availability_slots FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

CREATE POLICY "Providers can manage their own slots"
ON public.availability_slots FOR ALL
USING (provider_user_id = auth.uid())
WITH CHECK (provider_user_id = auth.uid());

-- Function to check if user is ambassador
CREATE OR REPLACE FUNCTION public.is_ambassador()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'ambassador'::app_role
  )
$$;

-- Function to check if user is provider
CREATE OR REPLACE FUNCTION public.is_provider()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'provider'::app_role
  )
$$;

-- Function to get ambassador stats
CREATE OR REPLACE FUNCTION public.get_ambassador_stats(ambassador_user_id uuid)
RETURNS TABLE (
    active_experiences_count bigint,
    total_revenue numeric,
    total_sales bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT e.id) as active_experiences_count,
        COALESCE(SUM(v.purchase_price), 0) as total_revenue,
        COUNT(v.id) as total_sales
    FROM public.experiences e
    LEFT JOIN public.vouchers v ON v.experience_id = e.id AND v.status IN ('active', 'used')
    WHERE e.ambassador_id = ambassador_user_id
    AND e.is_active = true;
END;
$$;

-- Update experience policies for ambassadors
CREATE POLICY "Ambassadors can insert their own experiences"
ON public.experiences FOR INSERT
WITH CHECK (
    has_role(auth.uid(), 'ambassador'::app_role)
    AND ambassador_id = auth.uid()
);

CREATE POLICY "Ambassadors can update their own experiences"
ON public.experiences FOR UPDATE
USING (ambassador_id = auth.uid() AND has_role(auth.uid(), 'ambassador'::app_role));

-- Allow providers to update images of their assigned experiences
CREATE POLICY "Providers can insert their assigned experience images"
ON public.experience_images FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.experience_providers ep
        WHERE ep.experience_id = experience_images.experience_id
        AND ep.provider_user_id = auth.uid()
        AND ep.is_active = true
    )
);

CREATE POLICY "Providers can update their assigned experience images"
ON public.experience_images FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.experience_providers ep
        WHERE ep.experience_id = experience_images.experience_id
        AND ep.provider_user_id = auth.uid()
        AND ep.is_active = true
    )
);