CREATE TABLE public.region_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(region_id, email)
);

ALTER TABLE public.region_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to region notifications"
  ON public.region_notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all region notifications"
  ON public.region_notifications FOR SELECT
  USING (is_admin());