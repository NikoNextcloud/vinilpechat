-- Prevent duplicate product imports from the three Scorpioplast pages,
-- even when the sync is retried or another deployment runs concurrently.
CREATE UNIQUE INDEX IF NOT EXISTS vinyl_product_unique_supplier_url
ON public.vinyl_products(source);
