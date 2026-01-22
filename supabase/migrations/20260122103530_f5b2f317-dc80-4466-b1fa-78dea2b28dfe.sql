-- Add "Ce include" list to experiences
ALTER TABLE public.experiences
ADD COLUMN IF NOT EXISTS includes text[] NOT NULL DEFAULT '{}'::text[];

-- Add focal point controls for image framing
ALTER TABLE public.experience_images
ADD COLUMN IF NOT EXISTS focal_x numeric NOT NULL DEFAULT 50,
ADD COLUMN IF NOT EXISTS focal_y numeric NOT NULL DEFAULT 50;

-- Basic sanity bounds (not CHECK constraints to avoid immutability issues)
-- We'll enforce in app; DB defaults keep existing rows consistent.