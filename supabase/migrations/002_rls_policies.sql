-- RLS policies for authenticated (including anonymous) users
-- user_id in tables = auth.uid() for Supabase Auth

CREATE POLICY "Users can read own" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can insert own" ON public.users
  FOR INSERT WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Children: user can CRUD own" ON public.children
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Consents: user can CRUD own" ON public.consents
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Assets: user can CRUD own" ON public.assets
  FOR ALL USING (owner_user_id = auth.uid());

CREATE POLICY "Jobs: user can CRUD own" ON public.jobs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Stories: via job ownership" ON public.stories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.jobs
      WHERE jobs.id = stories.job_id AND jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Books: user can read own" ON public.books
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Orders: user can CRUD own" ON public.orders
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Payments: via order ownership" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = payments.order_id AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Templates: public read" ON public.templates
  FOR SELECT USING (true);
