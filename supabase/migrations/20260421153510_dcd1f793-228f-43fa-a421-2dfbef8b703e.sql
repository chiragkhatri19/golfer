-- Donations table (independent of subscriptions)
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  charity_id UUID NOT NULL REFERENCES public.charities(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  donor_name TEXT,
  donor_email TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'recorded',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can record a donation" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users view own donations" ON public.donations FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins manage donations" ON public.donations FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Notifications (in-app)
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, created_at DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage notifications" ON public.notifications FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "System inserts notifications" ON public.notifications FOR INSERT WITH CHECK (true);

-- Notify all members when a draw is published
CREATE OR REPLACE FUNCTION public.notify_draw_published()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    SELECT user_id, 'New draw published', 'The ' || NEW.month || ' draw results are live.', '/dashboard'
    FROM public.profiles;
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_draw_published AFTER UPDATE ON public.draws
FOR EACH ROW EXECUTE FUNCTION public.notify_draw_published();

-- Notify winners on insert and on status change
CREATE OR REPLACE FUNCTION public.notify_winner_event()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id, 'You won!', 'You matched ' || NEW.tier || ' numbers — £' || NEW.prize_amount || '. Upload your proof.', '/dashboard');
  ELSIF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.notifications (user_id, title, body, link)
    VALUES (NEW.user_id, 'Winner status: ' || NEW.status, 'Your prize for the ' || NEW.tier || '-match is now ' || NEW.status || '.', '/dashboard');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_winner_insert AFTER INSERT ON public.winners
FOR EACH ROW EXECUTE FUNCTION public.notify_winner_event();
CREATE TRIGGER trg_notify_winner_update AFTER UPDATE ON public.winners
FOR EACH ROW EXECUTE FUNCTION public.notify_winner_event();