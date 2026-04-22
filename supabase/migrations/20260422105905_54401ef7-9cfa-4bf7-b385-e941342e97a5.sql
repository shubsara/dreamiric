
-- 1. Server-side enforcement of free-tier dream limit
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_dream_free_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dream_count integer;
BEGIN
  IF public.has_active_subscription(NEW.user_id) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO dream_count FROM public.dreams WHERE user_id = NEW.user_id;
  IF dream_count >= 10 THEN
    RAISE EXCEPTION 'Free tier limit reached. Upgrade to Pro to record more dreams.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_dream_free_limit_trigger ON public.dreams;
CREATE TRIGGER enforce_dream_free_limit_trigger
  BEFORE INSERT ON public.dreams
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_dream_free_limit();

-- 2. Tighten dream-audio storage to per-user folder ownership
DROP POLICY IF EXISTS "Authenticated users can read dream audio" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload dream audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own dream audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own dream audio" ON storage.objects;

CREATE POLICY "Users can read own dream audio"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dream-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own dream audio"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dream-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own dream audio"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'dream-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own dream audio"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'dream-audio'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. Restrict dream-images SELECT to specific object reads (prevent listing entire bucket)
-- Bucket remains public so direct URLs work, but listing is removed for anon role.
-- The existing policy already only allows SELECT on the bucket; public direct fetch via CDN
-- does not require the SELECT policy. We restrict listing by limiting SELECT to authenticated owners.
DROP POLICY IF EXISTS "Dream images are publicly accessible" ON storage.objects;

CREATE POLICY "Users can read own dream images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'dream-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can upload own dream images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'dream-images'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
