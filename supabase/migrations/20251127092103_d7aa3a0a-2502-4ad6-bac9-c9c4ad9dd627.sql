-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles (users can view their own roles)
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Create index for faster role lookups
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);

-- Security definer function to check if user has a role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin'::app_role)
$$;

-- Add admin policies for experiences
CREATE POLICY "Admins can insert experiences"
ON public.experiences
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update experiences"
ON public.experiences
FOR UPDATE
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can delete experiences"
ON public.experiences
FOR DELETE
TO authenticated
USING (public.is_admin());

-- Add admin policies for bookings (admins can view all)
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Add admin policies for vouchers (admins can view all)
CREATE POLICY "Admins can view all vouchers"
ON public.vouchers
FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admins can update all vouchers"
ON public.vouchers
FOR UPDATE
TO authenticated
USING (public.is_admin());

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check for admin first (highest priority)
  IF public.has_role(_user_id, 'admin'::app_role) THEN
    RETURN 'admin';
  END IF;
  
  -- Check for moderator
  IF public.has_role(_user_id, 'moderator'::app_role) THEN
    RETURN 'moderator';
  END IF;
  
  -- Default to user
  RETURN 'user';
END;
$$;