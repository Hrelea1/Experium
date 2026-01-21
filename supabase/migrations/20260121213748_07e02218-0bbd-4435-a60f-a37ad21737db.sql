-- Allow admins to manage experience images (needed for editing experiences)
ALTER TABLE public.experience_images ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Insert
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='experience_images' AND policyname='Admins can insert experience images'
  ) THEN
    CREATE POLICY "Admins can insert experience images"
    ON public.experience_images
    FOR INSERT
    WITH CHECK (public.is_admin());
  END IF;

  -- Update
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='experience_images' AND policyname='Admins can update experience images'
  ) THEN
    CREATE POLICY "Admins can update experience images"
    ON public.experience_images
    FOR UPDATE
    USING (public.is_admin());
  END IF;

  -- Delete
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='public' AND tablename='experience_images' AND policyname='Admins can delete experience images'
  ) THEN
    CREATE POLICY "Admins can delete experience images"
    ON public.experience_images
    FOR DELETE
    USING (public.is_admin());
  END IF;
END $$;