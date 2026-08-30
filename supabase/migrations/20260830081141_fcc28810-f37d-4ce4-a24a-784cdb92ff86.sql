ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_path text;

CREATE POLICY "staff read avatars" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND public.is_staff(auth.uid()));

CREATE POLICY "own avatar insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (public.has_role(auth.uid(), 'admin') OR (storage.foldername(name))[1] = auth.uid()::text)
);

CREATE POLICY "own avatar update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (public.has_role(auth.uid(), 'admin') OR (storage.foldername(name))[1] = auth.uid()::text)
);

CREATE POLICY "own avatar delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (public.has_role(auth.uid(), 'admin') OR (storage.foldername(name))[1] = auth.uid()::text)
);