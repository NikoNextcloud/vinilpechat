-- Applied once to production on 2026-10-12.
-- Multiplies only RETAIL sale_price fields by 1.50, rounded to cents.
-- Supplier costs and saved customer orders are not changed.
CREATE TABLE IF NOT EXISTS public.vinyl_price_change_log (
 change_key text PRIMARY KEY,
 applied_at timestamptz NOT NULL DEFAULT now(),
 multiplier numeric(8,4) NOT NULL,
 updated_products integer NOT NULL,
 updated_variants integer NOT NULL,
 note text NOT NULL DEFAULT ''
);
ALTER TABLE public.vinyl_price_change_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vinyl_price_change_log FROM anon, authenticated;

DO $retail_increase$
DECLARE
  product_count integer := 0;
  variant_count integer := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM public.vinyl_price_change_log WHERE change_key = 'retail_plus_50_pct_20261012') THEN
    RAISE EXCEPTION 'Retail price increase already applied; refusing to multiply a second time.';
  END IF;

  UPDATE public.vinyl_products
  SET sale_price = round(sale_price * 1.50,2), updated_at=now()
  WHERE sale_price IS NOT NULL;
  GET DIAGNOSTICS product_count = ROW_COUNT;

  UPDATE public.vinyl_variants
  SET sale_price = round(sale_price * 1.50,2)
  WHERE sale_price IS NOT NULL;
  GET DIAGNOSTICS variant_count = ROW_COUNT;

  INSERT INTO public.vinyl_price_change_log (change_key,multiplier,updated_products,updated_variants,note)
  VALUES ('retail_plus_50_pct_20261012',1.50,product_count,variant_count,
    'Requested 50% retail price increase. Supplier prices and past order snapshots unchanged.');
END $retail_increase$;
