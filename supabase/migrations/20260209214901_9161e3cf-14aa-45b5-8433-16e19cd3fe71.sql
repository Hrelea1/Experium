
CREATE OR REPLACE FUNCTION public.track_homepage_content_creation()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Only create audit record if there's an authenticated user
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO public.homepage_content_audit (content_id, section_key, old_content, new_content, changed_by)
    VALUES (NEW.id, NEW.section_key, NULL, NEW.content, auth.uid());
  END IF;
  RETURN NEW;
END;
$function$;
