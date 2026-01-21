-- Fix admin visibility for inactive experiences/services by replacing RESTRICTIVE SELECT policies
-- (RESTRICTIVE policies are AND-ed and prevent admins from seeing inactive rows)

-- Experiences
DROP POLICY IF EXISTS "Allow public read access to active experiences" ON public.experiences;

CREATE POLICY "Allow public read access to active experiences"
ON public.experiences
AS PERMISSIVE
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all experiences"
ON public.experiences
AS PERMISSIVE
FOR SELECT
USING (is_admin());

-- Experience services
DROP POLICY IF EXISTS "Allow public read access to active services" ON public.experience_services;

CREATE POLICY "Allow public read access to active services"
ON public.experience_services
AS PERMISSIVE
FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can view all services"
ON public.experience_services
AS PERMISSIVE
FOR SELECT
USING (is_admin());