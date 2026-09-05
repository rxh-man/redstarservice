CREATE POLICY "staff read workflow docs" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff(auth.uid()));
CREATE POLICY "staff upload workflow docs" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'documents' AND public.is_staff(auth.uid()));
CREATE POLICY "staff update workflow docs" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff(auth.uid()));
CREATE POLICY "staff delete workflow docs" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'documents' AND public.is_staff(auth.uid()));