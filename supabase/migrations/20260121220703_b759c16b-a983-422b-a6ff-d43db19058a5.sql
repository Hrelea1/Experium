-- Create a public bucket for experience images
INSERT INTO storage.buckets (id, name, public)
VALUES ('experience-images', 'experience-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for experience images
-- Public can read
DROP POLICY IF EXISTS "Public can read experience images" ON storage.objects;
CREATE POLICY "Public can read experience images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'experience-images');

-- Admins can upload
DROP POLICY IF EXISTS "Admins can upload experience images" ON storage.objects;
CREATE POLICY "Admins can upload experience images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'experience-images' AND is_admin());

-- Admins can update
DROP POLICY IF EXISTS "Admins can update experience images" ON storage.objects;
CREATE POLICY "Admins can update experience images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'experience-images' AND is_admin())
WITH CHECK (bucket_id = 'experience-images' AND is_admin());

-- Admins can delete
DROP POLICY IF EXISTS "Admins can delete experience images" ON storage.objects;
CREATE POLICY "Admins can delete experience images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'experience-images' AND is_admin());