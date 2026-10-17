/*
# Create roleplay stories library

1. New Tables
- `roleplay_stories` stores the stories created in the app.
- `id` is the generated story identifier.
- `title` is the story name shown on cards and chat headers.
- `category` stores the chosen genre label.
- `about` describes the story setup.
- `starting_chat` stores the opening roleplay message.
- `play_guide` stores optional guidance for the AI roleplay.
- `language` stores the preferred chat language.
- `cover_image` stores an uploaded image preview or a built-in cover reference.
- `created_at` records when the story was saved.

2. Security
- Row level security is enabled.
- This is a single-tenant, no-sign-in app, so anonymous and authenticated visitors can create, read, update, and delete the intentionally shared story library.

3. Important Notes
- No user account or personal ownership column is added because the current experience does not include sign-in.
- The policies are split into separate CRUD policies for predictable access control.
*/

CREATE TABLE IF NOT EXISTS public.roleplay_stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  category text NOT NULL DEFAULT 'Roleplay',
  about text NOT NULL DEFAULT '',
  starting_chat text NOT NULL DEFAULT '',
  play_guide text NOT NULL DEFAULT '',
  language text NOT NULL DEFAULT 'English',
  cover_image text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.roleplay_stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read roleplay stories" ON public.roleplay_stories;
CREATE POLICY "Public can read roleplay stories"
  ON public.roleplay_stories FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Public can create roleplay stories" ON public.roleplay_stories;
CREATE POLICY "Public can create roleplay stories"
  ON public.roleplay_stories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update roleplay stories" ON public.roleplay_stories;
CREATE POLICY "Public can update roleplay stories"
  ON public.roleplay_stories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public can delete roleplay stories" ON public.roleplay_stories;
CREATE POLICY "Public can delete roleplay stories"
  ON public.roleplay_stories FOR DELETE
  TO anon, authenticated
  USING (true);
