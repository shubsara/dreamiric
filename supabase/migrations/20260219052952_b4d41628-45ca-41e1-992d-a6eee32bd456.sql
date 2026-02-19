
-- Enable extensions needed for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Push subscriptions table
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert push subscriptions"
  ON public.push_subscriptions FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can read push subscriptions"
  ON public.push_subscriptions FOR SELECT USING (true);

CREATE POLICY "Anyone can delete push subscriptions"
  ON public.push_subscriptions FOR DELETE USING (true);
