-- 004_storage_policies.sql
-- Fix: "new row violates row-level security policy" on file/photo/audio uploads
-- Root cause: storage.objects has RLS enabled but NO policies allowing uploads

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Messages bucket: upload
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload message files') THEN
    CREATE POLICY "Authenticated users can upload message files"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'messages' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Messages bucket: read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can read message files') THEN
    CREATE POLICY "Authenticated users can read message files"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'messages' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Messages bucket: update (upsert support)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update message files') THEN
    CREATE POLICY "Authenticated users can update message files"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'messages' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Messages bucket: delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete message files') THEN
    CREATE POLICY "Authenticated users can delete message files"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'messages' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Avatars bucket: upload
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload avatars') THEN
    CREATE POLICY "Authenticated users can upload avatars"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Avatars bucket: public read
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anyone can read avatars') THEN
    CREATE POLICY "Anyone can read avatars"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'avatars');
  END IF;
END $$;
