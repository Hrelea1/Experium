-- Add default content for all remaining homepage sections

-- Categories section
INSERT INTO public.homepage_content (section_key, content)
VALUES (
  'categories',
  jsonb_build_object(
    'badge', 'Categorii',
    'title', 'Explorează După Interes',
    'subtitle', 'Alege categoria perfectă pentru tine sau pentru cei dragi și descoperă experiențe memorabile în toată România.'
  )
)
ON CONFLICT (section_key) DO NOTHING;

-- Featured Experiences section
INSERT INTO public.homepage_content (section_key, content)
VALUES (
  'featured',
  jsonb_build_object(
    'badge', 'Recomandate',
    'title', 'Experiențe Populare',
    'subtitle', 'Cele mai apreciate experiențe de către clienții noștri.',
    'ctaText', 'Vezi Toate'
  )
)
ON CONFLICT (section_key) DO NOTHING;

-- Regions section
INSERT INTO public.homepage_content (section_key, content)
VALUES (
  'regions',
  jsonb_build_object(
    'badge', 'Regiuni',
    'title', 'Descoperă România',
    'subtitle', 'Explorează experiențe unice în cele mai frumoase regiuni ale țării, de la munții Carpați la litoralul Mării Negre.'
  )
)
ON CONFLICT (section_key) DO NOTHING;

-- How It Works section
INSERT INTO public.homepage_content (section_key, content)
VALUES (
  'how-it-works',
  jsonb_build_object(
    'badge', 'Cum funcționează',
    'title', 'Simplu ca 1, 2, 3, 4',
    'subtitle', 'Oferirea de experiențe cadou nu a fost niciodată mai simplă. Urmează acești pași și surprinde pe cei dragi.'
  )
)
ON CONFLICT (section_key) DO NOTHING;

-- Testimonials section
INSERT INTO public.homepage_content (section_key, content)
VALUES (
  'testimonials',
  jsonb_build_object(
    'badge', 'Recenzii',
    'title', 'Ce Spun Clienții Noștri',
    'subtitle', 'Peste 50,000 de clienți fericiți au trăit experiențe memorabile prin platforma noastră.'
  )
)
ON CONFLICT (section_key) DO NOTHING;

-- Newsletter section
INSERT INTO public.homepage_content (section_key, content)
VALUES (
  'newsletter',
  jsonb_build_object(
    'title', 'Fii Primul Care Află',
    'subtitle', 'Abonează-te pentru a primi oferte exclusive, experiențe noi și idei de cadouri direct în inbox-ul tău.',
    'placeholder', 'Adresa ta de email',
    'ctaText', 'Abonează-te',
    'disclaimer', 'Ne angajăm să nu îți trimitem spam. Poți să te dezabonezi oricând.'
  )
)
ON CONFLICT (section_key) DO NOTHING;