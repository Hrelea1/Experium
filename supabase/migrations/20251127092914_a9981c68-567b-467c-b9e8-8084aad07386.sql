-- Function to automatically grant admin role to hrelea001@gmail.com on signup
CREATE OR REPLACE FUNCTION public.auto_grant_admin_to_primary()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if the new user is the primary admin
  IF NEW.email = 'hrelea001@gmail.com' THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to auto-grant admin role
CREATE TRIGGER auto_grant_admin_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_admin_to_primary();

-- Grant admin role to existing hrelea001@gmail.com account if it exists
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Find the user with email hrelea001@gmail.com
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'hrelea001@gmail.com';
  
  -- If user exists, grant admin role
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_user_id, 'admin'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END;
$$;

-- Function to check if user is the primary admin
CREATE OR REPLACE FUNCTION public.is_primary_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = _user_id;
  
  RETURN user_email = 'hrelea001@gmail.com';
END;
$$;

-- Add RLS policy for user_roles that only allows primary admin to insert
CREATE POLICY "Primary admin can manage user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_primary_admin(auth.uid()));