-- Create experience_services table for add-on services
CREATE TABLE public.experience_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  experience_id UUID NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL CHECK (price >= 0),
  is_required BOOLEAN NOT NULL DEFAULT false,
  max_quantity INTEGER NOT NULL DEFAULT 1 CHECK (max_quantity >= 1),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.experience_services ENABLE ROW LEVEL SECURITY;

-- Public can read active services
CREATE POLICY "Allow public read access to active services"
ON public.experience_services
FOR SELECT
USING (is_active = true);

-- Admins can insert services
CREATE POLICY "Admins can insert services"
ON public.experience_services
FOR INSERT
WITH CHECK (is_admin());

-- Admins can update services
CREATE POLICY "Admins can update services"
ON public.experience_services
FOR UPDATE
USING (is_admin());

-- Admins can delete services
CREATE POLICY "Admins can delete services"
ON public.experience_services
FOR DELETE
USING (is_admin());

-- Create trigger for updated_at
CREATE TRIGGER update_experience_services_updated_at
BEFORE UPDATE ON public.experience_services
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_experience_services_experience_id ON public.experience_services(experience_id);
CREATE INDEX idx_experience_services_display_order ON public.experience_services(display_order);