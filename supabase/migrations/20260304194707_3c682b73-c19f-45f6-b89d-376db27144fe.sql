
-- Task 4: Add billing fields to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'individual',
  ADD COLUMN IF NOT EXISTS billing_first_name text,
  ADD COLUMN IF NOT EXISTS billing_last_name text,
  ADD COLUMN IF NOT EXISTS billing_email text,
  ADD COLUMN IF NOT EXISTS billing_phone text,
  ADD COLUMN IF NOT EXISTS billing_address text,
  ADD COLUMN IF NOT EXISTS company_name text,
  ADD COLUMN IF NOT EXISTS cui text,
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS company_address text;

-- Task 5: Create reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  experience_id uuid NOT NULL REFERENCES public.experiences(id) ON DELETE CASCADE,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(booking_id)
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviews"
  ON public.reviews FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public can read all reviews"
  ON public.reviews FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage all reviews"
  ON public.reviews FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Function to update experience avg_rating after review
CREATE OR REPLACE FUNCTION public.update_experience_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  UPDATE public.experiences
  SET avg_rating = (
    SELECT ROUND(AVG(rating)::numeric, 1)
    FROM public.reviews
    WHERE experience_id = NEW.experience_id
  ),
  total_reviews = (
    SELECT COUNT(*)
    FROM public.reviews
    WHERE experience_id = NEW.experience_id
  ),
  updated_at = NOW()
  WHERE id = NEW.experience_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_experience_rating_trigger
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_experience_rating();

-- Task 6: Add lat/lng to experiences
ALTER TABLE public.experiences
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS address text;
