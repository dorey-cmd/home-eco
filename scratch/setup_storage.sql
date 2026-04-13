-- Create a storage bucket called "images"
INSERT INTO storage.buckets (id, name, public) VALUES ('images', 'images', true) ON CONFLICT DO NOTHING;

-- Set up policies so everyone can read and authenticated users can insert (upload)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can update their files" ON storage.objects;
CREATE POLICY "Users can update their files" ON storage.objects FOR UPDATE USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Users can delete their files" ON storage.objects;
CREATE POLICY "Users can delete their files" ON storage.objects FOR DELETE USING ( bucket_id = 'images' AND auth.role() = 'authenticated' );
