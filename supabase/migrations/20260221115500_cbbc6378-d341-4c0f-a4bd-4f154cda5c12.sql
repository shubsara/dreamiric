
-- =============================================
-- Fix 1: Replace permissive RLS on dreams table
-- =============================================
DROP POLICY IF EXISTS "Anyone can read dreams" ON public.dreams;
DROP POLICY IF EXISTS "Anyone can create dreams" ON public.dreams;
DROP POLICY IF EXISTS "Anyone can update dreams" ON public.dreams;
DROP POLICY IF EXISTS "Anyone can delete dreams" ON public.dreams;

CREATE POLICY "Users can read own dreams" ON public.dreams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dreams" ON public.dreams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dreams" ON public.dreams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dreams" ON public.dreams FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- Fix 2: Replace permissive RLS on dream_messages
-- =============================================
DROP POLICY IF EXISTS "Anyone can read dream messages" ON public.dream_messages;
DROP POLICY IF EXISTS "Anyone can create dream messages" ON public.dream_messages;

CREATE POLICY "Users can read own dream messages" ON public.dream_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.dreams WHERE dreams.id = dream_messages.dream_id AND dreams.user_id = auth.uid()));
CREATE POLICY "Users can insert own dream messages" ON public.dream_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.dreams WHERE dreams.id = dream_messages.dream_id AND dreams.user_id = auth.uid()));

-- =============================================
-- Fix 3: Add user_id to push_subscriptions + fix RLS
-- =============================================
ALTER TABLE public.push_subscriptions ADD COLUMN IF NOT EXISTS user_id UUID;

DROP POLICY IF EXISTS "Anyone can insert push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can read push subscriptions" ON public.push_subscriptions;
DROP POLICY IF EXISTS "Anyone can delete push subscriptions" ON public.push_subscriptions;

CREATE POLICY "Users can insert own push subscriptions" ON public.push_subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can read own push subscriptions" ON public.push_subscriptions FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own push subscriptions" ON public.push_subscriptions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- Fix 4: Storage policies - restrict to authenticated users
-- =============================================
DROP POLICY IF EXISTS "Anyone can upload dream images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload dream audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read dream audio" ON storage.objects;

CREATE POLICY "Authenticated users can upload dream images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dream-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload dream audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'dream-audio' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can read dream audio" ON storage.objects
  FOR SELECT USING (bucket_id = 'dream-audio' AND auth.role() = 'authenticated');
