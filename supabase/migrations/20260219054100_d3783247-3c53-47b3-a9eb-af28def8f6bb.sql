
-- Delete orphaned dreams that have no user_id (pre-auth data)
-- (RLS policies already applied in previous migration)
-- Just delete old anonymous dreams so user_id can be set NOT NULL
DELETE FROM public.dreams WHERE user_id IS NULL;

-- Now enforce non-nullable
ALTER TABLE public.dreams ALTER COLUMN user_id SET NOT NULL;
