DROP POLICY IF EXISTS "System inserts notifications" ON public.notifications;
CREATE POLICY "Admins insert notifications" ON public.notifications
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));