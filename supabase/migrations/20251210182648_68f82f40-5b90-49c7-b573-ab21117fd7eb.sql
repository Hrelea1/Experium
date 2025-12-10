-- Allow primary admin to view all user roles
CREATE POLICY "Primary admin can view all user roles"
ON public.user_roles
FOR SELECT
USING (is_primary_admin(auth.uid()));

-- Allow primary admin to delete user roles
CREATE POLICY "Primary admin can delete user roles"
ON public.user_roles
FOR DELETE
USING (is_primary_admin(auth.uid()));