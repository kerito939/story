/*
# Add global roleplay model library

1. New Tables
- `roleplay_models` stores one shared AI model entry for the app.
- `id` is the generated model identifier.
- `name` is the uploaded filename shown in the model picker.
- `format` records the file format such as GGUF or SafeTensors.
- `size_bytes` records the uploaded file size.
- `storage_path` points to the private Supabase Storage object.
- `is_active` marks the model used by every story chat.
- `created_at` records when the model was uploaded.

2. Storage
- Creates the private `roleplay-models` bucket for uploaded model files.
- Anonymous and authenticated visitors can use this shared, no-sign-in app's model library through explicit storage policies.

3. Security
- Row level security is enabled on `roleplay_models`.
- Four separate CRUD policies are added for the intentional single-tenant experience.
- Storage access is limited to the `roleplay-models` bucket and its `global/` folder.

4. Important Notes
- The active model is global so every story uses the same selected model.
- The browser records and uploads the model file, but actual GGUF inference must be provided by a model runtime or AI service connected to the chat function.
*/

CREATE TABLE IF NOT EXISTS public.roleplay_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  format text NOT NULL,
  size_bytes bigint NOT NULL,
  storage_path text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roleplay_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read roleplay models" ON public.roleplay_models;
CREATE POLICY "Public can read roleplay models"
  ON public.roleplay_models FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create roleplay models" ON public.roleplay_models;
CREATE POLICY "Public can create roleplay models"
  ON public.roleplay_models FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update roleplay models" ON public.roleplay_models;
CREATE POLICY "Public can update roleplay_models"
  ON public.roleplay_models FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete roleplay models" ON public.roleplay_models;
CREATE POLICY "Public can delete roleplay models"
  ON public.roleplay_models FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public)
VALUES ('roleplay-models', 'roleplay-models', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can read roleplay model files" ON storage.objects;
CREATE POLICY "Public can read roleplay model files"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'roleplay-models' AND (storage.foldername(name))[1] = 'global');

DROP POLICY IF EXISTS "Public can upload roleplay model files" ON storage.objects;
CREATE POLICY "Public can upload roleplay model files"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'roleplay-models' AND (storage.foldername(name))[1] = 'global');

DROP POLICY IF EXISTS "Public can update roleplay model files" ON storage.objects;
CREATE POLICY "Public can update roleplay model files"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'roleplay-models' AND (storage.foldername(name))[1] = 'global')
  WITH CHECK (bucket_id = 'roleplay-models' AND (storage.foldername(name))[1] = 'global');

DROP POLICY IF EXISTS "Public can delete roleplay model files" ON storage.objects;
CREATE POLICY "Public can delete roleplay model files"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'roleplay-models' AND (storage.foldername(name))[1] = 'global');
