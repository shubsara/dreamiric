
-- Create dreams table
CREATE TABLE public.dreams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  title TEXT NOT NULL DEFAULT 'Untitled Dream',
  raw_transcript TEXT,
  dream_text TEXT NOT NULL,
  emotional_theme TEXT,
  image_url TEXT,
  interpretation TEXT,
  symbols JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dream_messages table for chat
CREATE TABLE public.dream_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dream_id UUID NOT NULL REFERENCES public.dreams(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create storage bucket for dream images
INSERT INTO storage.buckets (id, name, public) VALUES ('dream-images', 'dream-images', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('dream-audio', 'dream-audio', false);

-- Enable RLS
ALTER TABLE public.dreams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dream_messages ENABLE ROW LEVEL SECURITY;

-- Public access policies (no auth required for this journal - user_id can be null)
CREATE POLICY "Anyone can read dreams" ON public.dreams FOR SELECT USING (true);
CREATE POLICY "Anyone can create dreams" ON public.dreams FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update dreams" ON public.dreams FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete dreams" ON public.dreams FOR DELETE USING (true);

CREATE POLICY "Anyone can read dream messages" ON public.dream_messages FOR SELECT USING (true);
CREATE POLICY "Anyone can create dream messages" ON public.dream_messages FOR INSERT WITH CHECK (true);

-- Storage policies
CREATE POLICY "Dream images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'dream-images');
CREATE POLICY "Anyone can upload dream images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dream-images');
CREATE POLICY "Anyone can upload dream audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'dream-audio');
CREATE POLICY "Anyone can read dream audio" ON storage.objects FOR SELECT USING (bucket_id = 'dream-audio');

-- Update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_dreams_updated_at
  BEFORE UPDATE ON public.dreams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
