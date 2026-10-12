-- Customer-specific variants and independent supplier/retail prices.
-- This table is only accessed through authenticated server-side API (service role).
CREATE TABLE IF NOT EXISTS public.vinyl_variants (
  product_id integer NOT NULL REFERENCES public.vinyl_products(id) ON DELETE CASCADE,
  variant_key text NOT NULL,
  label text NOT NULL,
  choices jsonb NOT NULL DEFAULT '{}'::jsonb,
  supplier_price numeric(12,2),
  sale_price numeric(12,2),
  active boolean NOT NULL DEFAULT true,
  price_verification_needed boolean NOT NULL DEFAULT true,
  synced_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, variant_key),
  CONSTRAINT vinyl_variant_key_size CHECK (length(variant_key) BETWEEN 1 AND 500),
  CONSTRAINT vinyl_variant_sale_nonnegative CHECK (sale_price IS NULL OR sale_price >= 0),
  CONSTRAINT vinyl_variant_supplier_nonnegative CHECK (supplier_price IS NULL OR supplier_price >= 0)
);
CREATE INDEX IF NOT EXISTS vinyl_variants_product_idx ON public.vinyl_variants(product_id);
ALTER TABLE public.vinyl_variants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vinyl_variants FROM anon, authenticated;