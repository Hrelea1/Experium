
-- Make the foreign key constraint deferrable so the audit trigger can work
ALTER TABLE public.homepage_content_audit
  DROP CONSTRAINT IF EXISTS homepage_content_audit_content_id_fkey;

ALTER TABLE public.homepage_content_audit
  ADD CONSTRAINT homepage_content_audit_content_id_fkey
  FOREIGN KEY (content_id) REFERENCES public.homepage_content(id)
  DEFERRABLE INITIALLY DEFERRED;

-- Also make the trigger AFTER INSERT instead of BEFORE
DROP TRIGGER IF EXISTS track_homepage_content_creation ON public.homepage_content;
CREATE TRIGGER track_homepage_content_creation
  AFTER INSERT ON public.homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION public.track_homepage_content_creation();
