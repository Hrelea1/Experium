
-- Fix the creation audit trigger to handle null auth.uid()
CREATE OR REPLACE FUNCTION public.track_homepage_content_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.homepage_content_audit (content_id, section_key, old_content, new_content, changed_by)
  VALUES (NEW.id, NEW.section_key, NULL, NEW.content, COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid));
  RETURN NEW;
END;
$function$;
