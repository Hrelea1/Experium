
-- In-app notifications for providers
CREATE TABLE public.provider_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'booking', -- booking, cancellation, reminder, system
  reference_id uuid, -- booking_id or other entity
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view their own notifications"
  ON public.provider_notifications FOR SELECT
  USING (provider_user_id = auth.uid());

CREATE POLICY "Providers can update their own notifications"
  ON public.provider_notifications FOR UPDATE
  USING (provider_user_id = auth.uid());

CREATE POLICY "Service role can insert notifications"
  ON public.provider_notifications FOR INSERT
  WITH CHECK (true);

CREATE INDEX idx_provider_notifications_user ON public.provider_notifications (provider_user_id, is_read, created_at DESC);

-- Push subscriptions storage
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push subscriptions"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Enable realtime for provider notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_notifications;
