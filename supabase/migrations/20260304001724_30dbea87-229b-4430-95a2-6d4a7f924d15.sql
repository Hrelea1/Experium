
-- Notification logs table for tracking all sent notifications
CREATE TABLE public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL, -- 'email' or 'sms'
  event_type text NOT NULL, -- 'booking_confirmed', 'booking_cancelled', 'booking_reminder', 'voucher_expiry', etc.
  recipient_email text,
  recipient_phone text,
  recipient_role text NOT NULL DEFAULT 'client', -- 'client' or 'provider'
  subject text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  voucher_id uuid REFERENCES public.vouchers(id) ON DELETE SET NULL,
  retry_count integer NOT NULL DEFAULT 0,
  max_retries integer NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  delivered_at timestamptz
);

-- Index for querying by user and event
CREATE INDEX idx_notification_logs_user ON public.notification_logs(user_id);
CREATE INDEX idx_notification_logs_event ON public.notification_logs(event_type);
CREATE INDEX idx_notification_logs_status ON public.notification_logs(status);
CREATE INDEX idx_notification_logs_retry ON public.notification_logs(status, next_retry_at) WHERE status = 'pending' OR status = 'failed';

-- RLS
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notification_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications"
  ON public.notification_logs FOR SELECT
  USING (is_admin());

CREATE POLICY "Service role can manage notifications"
  ON public.notification_logs FOR ALL
  USING (true)
  WITH CHECK (true);

-- Make service role policy only apply to service_role
ALTER POLICY "Service role can manage notifications" ON public.notification_logs TO service_role;

-- Notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  email_booking_confirmation boolean NOT NULL DEFAULT true,
  email_booking_cancellation boolean NOT NULL DEFAULT true,
  email_booking_reminder boolean NOT NULL DEFAULT true,
  email_voucher_expiry boolean NOT NULL DEFAULT true,
  email_marketing boolean NOT NULL DEFAULT false,
  sms_booking_confirmation boolean NOT NULL DEFAULT false,
  sms_booking_reminder boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all preferences"
  ON public.notification_preferences FOR SELECT
  USING (is_admin());

-- Auto-create notification preferences for new users
CREATE OR REPLACE FUNCTION public.create_notification_preferences()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER create_notification_prefs_on_profile
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_notification_preferences();

-- Newsletter subscribers table (for future Mailchimp sync)
CREATE TABLE public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  user_id uuid,
  full_name text,
  segment text NOT NULL DEFAULT 'general', -- 'general', 'client', 'provider'
  gdpr_consent boolean NOT NULL DEFAULT false,
  gdpr_consent_date timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  unsubscribe_token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  unsubscribed_at timestamptz
);

CREATE INDEX idx_newsletter_email ON public.newsletter_subscribers(email);
CREATE INDEX idx_newsletter_active ON public.newsletter_subscribers(is_active) WHERE is_active = true;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view their own subscription"
  ON public.newsletter_subscribers FOR SELECT
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their own subscription"
  ON public.newsletter_subscribers FOR UPDATE
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can view all subscribers"
  ON public.newsletter_subscribers FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all subscribers"
  ON public.newsletter_subscribers FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
