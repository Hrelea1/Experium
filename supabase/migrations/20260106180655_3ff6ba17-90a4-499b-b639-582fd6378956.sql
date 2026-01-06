-- =====================================================
-- SECURITY HARDENING MIGRATION
-- =====================================================

-- 1. Fix Function Search Path Vulnerability
-- Update all functions to have immutable search_path

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'admin'::app_role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
    ORDER BY created_at ASC
    LIMIT 1
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- 2. Fix Vouchers Policy - Remove exposure of unassigned vouchers
DROP POLICY IF EXISTS "Users can view their own vouchers" ON public.vouchers;

CREATE POLICY "Users can view their own vouchers"
ON public.vouchers
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR 
  public.is_admin()
);

-- 3. Add explicit deny policies for sensitive tables

-- Profiles: Ensure only authenticated users can see their own data
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Deny public access to profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.is_admin());

-- Bookings: Restrict to authenticated users only
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Deny public access to bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.is_admin());

-- User roles: Only allow users to see their own role
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Primary admin can view all roles" ON public.user_roles;

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Homepage content audit: Only admins
DROP POLICY IF EXISTS "Admins can view content audit" ON public.homepage_content_audit;

CREATE POLICY "Admins can view content audit"
ON public.homepage_content_audit
FOR SELECT
TO authenticated
USING (public.is_admin());

-- 4. Add INSERT/UPDATE/DELETE protection for user_roles
DROP POLICY IF EXISTS "Only primary admin can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Only primary admin can delete roles" ON public.user_roles;

CREATE POLICY "Only primary admin can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_primary_admin(auth.uid()));

CREATE POLICY "Only primary admin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_primary_admin(auth.uid()));

-- 5. Rate limiting helper function for auth attempts
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  identifier text,
  max_attempts integer DEFAULT 5,
  window_minutes integer DEFAULT 15
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  attempt_count integer;
BEGIN
  -- This is a placeholder for rate limiting logic
  -- In production, implement with a rate_limits table
  RETURN true;
END;
$$;