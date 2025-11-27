-- Create storage bucket for homepage images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('homepage-images', 'homepage-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create homepage_content table
CREATE TABLE IF NOT EXISTS public.homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.homepage_content ENABLE ROW LEVEL SECURITY;

-- Allow public read access to homepage content
CREATE POLICY "Allow public read access to homepage content"
  ON public.homepage_content
  FOR SELECT
  USING (true);

-- Allow admins to manage homepage content
CREATE POLICY "Admins can insert homepage content"
  ON public.homepage_content
  FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update homepage content"
  ON public.homepage_content
  FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins can delete homepage content"
  ON public.homepage_content
  FOR DELETE
  USING (is_admin());

-- Storage policies for homepage images
CREATE POLICY "Public can view homepage images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'homepage-images');

CREATE POLICY "Admins can upload homepage images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'homepage-images' AND is_admin());

CREATE POLICY "Admins can update homepage images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'homepage-images' AND is_admin());

CREATE POLICY "Admins can delete homepage images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'homepage-images' AND is_admin());

-- Insert default content for all sections
INSERT INTO public.homepage_content (section_key, content) VALUES
('hero', '{
  "title": "Oferă Momente",
  "titleHighlight": "Memorabile",
  "subtitle": "Descoperă cele mai frumoase experiențe din România. De la aventuri în natură la relaxare la spa, găsește cadoul perfect pentru cei dragi.",
  "badge": "Peste 500+ experiențe unice în România",
  "ctaPrimary": "Descoperă Experiențe",
  "ctaPrimaryLink": "/category/toate-categoriile",
  "ctaSecondary": "Ai un Voucher?",
  "ctaSecondaryLink": "/redeem-voucher",
  "backgroundImage": ""
}'::jsonb),
('categories', '{
  "badge": "Categorii",
  "title": "Explorează După Interes",
  "description": "Alege categoria perfectă pentru tine sau pentru cei dragi și descoperă experiențe memorabile în toată România."
}'::jsonb),
('featured', '{
  "badge": "Recomandate",
  "title": "Experiențe Populare",
  "description": "Cele mai apreciate experiențe de către clienții noștri.",
  "buttonText": "Vezi Toate"
}'::jsonb),
('regions', '{
  "badge": "Regiuni",
  "title": "Descoperă România",
  "description": "Explorează experiențe unice în cele mai frumoase regiuni ale țării, de la munții Carpați la litoralul Mării Negre."
}'::jsonb),
('how_it_works', '{
  "badge": "Cum funcționează",
  "title": "Simplu ca 1, 2, 3, 4",
  "description": "Oferirea de experiențe cadou nu a fost niciodată mai simplă. Urmează acești pași și surprinde pe cei dragi.",
  "steps": [
    {
      "title": "Alege Experiența",
      "description": "Explorează categoriile și găsește experiența perfectă pentru tine sau cei dragi."
    },
    {
      "title": "Oferă Cadoul",
      "description": "Primește un voucher digital sau fizic, personalizat cu un mesaj special."
    },
    {
      "title": "Programează",
      "description": "Beneficiarul alege data și locația care i se potrivește cel mai bine."
    },
    {
      "title": "Bucurați-vă!",
      "description": "Trăiește momente memorabile și creează amintiri de neuitat."
    }
  ]
}'::jsonb),
('testimonials', '{
  "badge": "Recenzii",
  "title": "Ce Spun Clienții Noștri",
  "description": "Peste 50,000 de clienți fericiți au trăit experiențe memorabile prin platforma noastră."
}'::jsonb),
('newsletter', '{
  "title": "Fii Primul Care Află",
  "description": "Abonează-te pentru a primi oferte exclusive, experiențe noi și idei de cadouri direct în inbox-ul tău.",
  "buttonText": "Abonează-te",
  "disclaimer": "Ne angajăm să nu îți trimitem spam. Poți să te dezabonezi oricând."
}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_homepage_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homepage_content_timestamp
  BEFORE UPDATE ON public.homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION update_homepage_content_updated_at();