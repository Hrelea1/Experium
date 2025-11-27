-- Add trigger to automatically track who updates content
CREATE OR REPLACE FUNCTION track_homepage_content_update()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_homepage_content_changes
  BEFORE UPDATE ON public.homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION track_homepage_content_update();

-- Add trigger to track content creation
CREATE OR REPLACE FUNCTION track_homepage_content_creation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE TRIGGER track_homepage_content_creator
  BEFORE INSERT ON public.homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION track_homepage_content_creation();

-- Add constraints for content validation
ALTER TABLE public.homepage_content
  ADD CONSTRAINT section_key_length CHECK (char_length(section_key) <= 50),
  ADD CONSTRAINT content_not_empty CHECK (jsonb_typeof(content) = 'object');

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_homepage_content_section_key 
  ON public.homepage_content(section_key);

-- Add audit log table for tracking all changes
CREATE TABLE IF NOT EXISTS public.homepage_content_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.homepage_content(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  old_content JSONB,
  new_content JSONB,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.homepage_content_audit ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.homepage_content_audit
  FOR SELECT
  USING (is_admin());

-- Create audit trigger
CREATE OR REPLACE FUNCTION log_homepage_content_changes()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    INSERT INTO public.homepage_content_audit (
      content_id,
      section_key,
      old_content,
      new_content,
      changed_by
    ) VALUES (
      NEW.id,
      NEW.section_key,
      OLD.content,
      NEW.content,
      auth.uid()
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER audit_homepage_content_changes
  AFTER UPDATE ON public.homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION log_homepage_content_changes();