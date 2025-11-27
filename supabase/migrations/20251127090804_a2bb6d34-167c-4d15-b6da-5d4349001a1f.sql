-- Create regions table
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create counties table
CREATE TABLE public.counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(region_id, name)
);

-- Create cities table
CREATE TABLE public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_id UUID NOT NULL REFERENCES public.counties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(county_id, name)
);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  image_url TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create experiences table
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  region_id UUID NOT NULL REFERENCES public.regions(id) ON DELETE RESTRICT,
  county_id UUID REFERENCES public.counties(id) ON DELETE SET NULL,
  city_id UUID REFERENCES public.cities(id) ON DELETE SET NULL,
  location_name TEXT NOT NULL,
  duration_minutes INTEGER,
  max_participants INTEGER DEFAULT 10,
  min_age INTEGER,
  avg_rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create experience_images table
CREATE TABLE public.experience_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experience_images ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public read access (anyone can view experiences and locations)
CREATE POLICY "Allow public read access to regions"
  ON public.regions FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to counties"
  ON public.counties FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to cities"
  ON public.cities FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to categories"
  ON public.categories FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to active experiences"
  ON public.experiences FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow public read access to experience images"
  ON public.experience_images FOR SELECT
  USING (true);

-- Create indexes for performance
CREATE INDEX idx_counties_region ON public.counties(region_id);
CREATE INDEX idx_cities_county ON public.cities(county_id);
CREATE INDEX idx_experiences_category ON public.experiences(category_id);
CREATE INDEX idx_experiences_region ON public.experiences(region_id);
CREATE INDEX idx_experiences_county ON public.experiences(county_id);
CREATE INDEX idx_experiences_city ON public.cities(id);
CREATE INDEX idx_experiences_active ON public.experiences(is_active);
CREATE INDEX idx_experiences_featured ON public.experiences(is_featured);
CREATE INDEX idx_experiences_price ON public.experiences(price);
CREATE INDEX idx_experiences_rating ON public.experiences(avg_rating);
CREATE INDEX idx_experience_images_experience ON public.experience_images(experience_id);

-- Create composite index for filtering
CREATE INDEX idx_experiences_filter ON public.experiences(category_id, region_id, price, avg_rating, is_active);

-- Create full-text search index for experiences
CREATE INDEX idx_experiences_search ON public.experiences 
  USING gin(to_tsvector('romanian', title || ' ' || description));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();