-- Allow primary admin to view all profiles for role management
CREATE POLICY "Primary admin can view all profiles"
ON public.profiles
FOR SELECT
USING (is_primary_admin(auth.uid()));