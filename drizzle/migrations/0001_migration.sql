
create policy "staff read photos" on storage.objects for select to authenticated using (bucket_id='photos' and public.is_staff(auth.uid()));
create policy "staff upload photos" on storage.objects for insert to authenticated with check (bucket_id='photos' and public.is_staff(auth.uid()));
create policy "admin delete photos" on storage.objects for delete to authenticated using (bucket_id='photos' and public.has_role(auth.uid(),'admin'));
