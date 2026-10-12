-- Statistics visible only to the authenticated server-side shop admin.
-- The service-role key is never exposed to the browser.
CREATE OR REPLACE FUNCTION public.vinyl_store_usage()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
 SELECT jsonb_build_object(
  'database_bytes',pg_database_size(current_database()),
  'storage_bytes',(SELECT COALESCE(sum((o.metadata->>'size')::bigint),0) FROM storage.objects o WHERE o.bucket_id='vinyl-product-images'),
  'photo_files',(SELECT count(*) FROM storage.objects o WHERE o.bucket_id='vinyl-product-images'),
  'products',(SELECT count(*) FROM public.vinyl_products),
  'products_with_images',(SELECT count(*) FROM public.vinyl_products WHERE image LIKE '%/storage/v1/object/public/vinyl-product-images/%'),
  'categories',(SELECT count(*) FROM public.vinyl_categories),
  'orders',(SELECT count(*) FROM public.vinyl_orders),
  'measured_at',now()
 );
$$;
REVOKE ALL ON FUNCTION public.vinyl_store_usage() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.vinyl_store_usage() TO service_role;
