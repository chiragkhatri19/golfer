-- ==========================================
-- CHARITY DRIVE - COMPLETE DATABASE SETUP
-- ==========================================
-- Run this entire script in your Supabase SQL Editor
-- ==========================================

-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ TIMESTAMP TRIGGER FN ============
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============ CHARITIES ============
CREATE TABLE public.charities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  featured BOOLEAN NOT NULL DEFAULT false,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Charities are public" ON public.charities FOR SELECT USING (true);
CREATE POLICY "Admins manage charities" ON public.charities FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER charities_updated_at BEFORE UPDATE ON public.charities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ PROFILES ============
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  charity_id UUID REFERENCES public.charities(id) ON DELETE SET NULL,
  charity_pct INTEGER NOT NULL DEFAULT 10 CHECK (charity_pct >= 10 AND charity_pct <= 100),
  subscription_status TEXT NOT NULL DEFAULT 'inactive',
  subscription_plan TEXT,
  renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ SCORES ============
CREATE TABLE public.scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own scores" ON public.scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own scores" ON public.scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own scores" ON public.scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own scores" ON public.scores FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage scores" ON public.scores FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_scores_user_date ON public.scores(user_id, date DESC);

-- Trigger to keep only the latest 5 scores per user
CREATE OR REPLACE FUNCTION public.enforce_score_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.scores
  WHERE id IN (
    SELECT id FROM public.scores
    WHERE user_id = NEW.user_id
    ORDER BY date DESC, created_at DESC
    OFFSET 5
  );
  RETURN NEW;
END;
$$;
CREATE TRIGGER scores_limit_5
  AFTER INSERT ON public.scores
  FOR EACH ROW EXECUTE FUNCTION public.enforce_score_limit();

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly','yearly')),
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  renewal_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own sub" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own sub" ON public.subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own sub" ON public.subscriptions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage subs" ON public.subscriptions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subs_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DRAWS ============
CREATE TABLE public.draws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','simulated','published')),
  logic_type TEXT NOT NULL DEFAULT 'random' CHECK (logic_type IN ('random','algorithmic')),
  winning_numbers INTEGER[],
  prize_pool NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.draws ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published draws are public" ON public.draws FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage draws" ON public.draws FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ DRAW ENTRIES ============
CREATE TABLE public.draw_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  matched_numbers INTEGER[],
  match_count INTEGER DEFAULT 0,
  prize_tier INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(draw_id, user_id)
);
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins manage entries" ON public.draw_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ============ WINNERS ============
CREATE TABLE public.winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draw_id UUID NOT NULL REFERENCES public.draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tier INTEGER NOT NULL,
  prize_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  proof_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','paid','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.winners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Winners are public" ON public.winners FOR SELECT USING (true);
CREATE POLICY "Users update own winner proof" ON public.winners FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins manage winners" ON public.winners FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER winners_updated_at BEFORE UPDATE ON public.winners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ STORAGE BUCKET ============
INSERT INTO storage.buckets (id, name, public) VALUES ('winner-proofs', 'winner-proofs', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload own proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'winner-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users view own proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'winner-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users update own proofs" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'winner-proofs' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins view all proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'winner-proofs' AND public.has_role(auth.uid(), 'admin')
  );

-- ============ DONATIONS ============
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

-- ============ NOTIFICATIONS ============
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
CREATE POLICY "Admins insert notifications" ON public.notifications
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ============ NOTIFICATION TRIGGERS ============

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
    VALUES (NEW.user_id, 'You won!', 'You matched ' || NEW.tier || ' numbers — ₹' || NEW.prize_amount || '. Upload your proof.', '/dashboard');
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

-- ============ SEED DATA: INDIAN CHARITIES ============
INSERT INTO public.charities (name, description, featured, image_url) VALUES
('Goonj', 'Channeling urban surplus to rural and urban underserved communities across India, empowering dignity through sharing.', true, null),
('Pratham', 'Providing quality education to underprivileged children across India with innovative learning programs.', false, null),
('Akshaya Patra Foundation', 'Running the world''s largest mid-day meal program for school children across India.', false, null),
('GiveIndia (Give Foundation)', 'Connecting donors with verified nonprofits to ensure transparent and impactful giving across India.', false, null),
('Teach For India', 'Addressing educational inequity by placing Fellows in low-income classrooms across the nation.', false, null),
('HelpAge India', 'Supporting elderly individuals in need with healthcare, shelter, and dignity across India.', false, null);
