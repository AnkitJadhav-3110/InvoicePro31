
-- Fix UPDATE policies: add WITH CHECK to prevent ownership transfer

-- profiles
DROP POLICY "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- clients
DROP POLICY "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- invoices
DROP POLICY "Users can update own invoices" ON public.invoices;
CREATE POLICY "Users can update own invoices" ON public.invoices
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- recurring_schedules
DROP POLICY "Users can update own schedules" ON public.recurring_schedules;
CREATE POLICY "Users can update own schedules" ON public.recurring_schedules
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- app_settings
DROP POLICY "Users can update own settings" ON public.app_settings;
CREATE POLICY "Users can update own settings" ON public.app_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
