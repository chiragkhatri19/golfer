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