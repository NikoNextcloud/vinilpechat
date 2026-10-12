-- Replaces previous +50% retail adjustment.
-- Fixed policy: retail = supplier cost + EUR 20, for every product and available variant.
-- Preserve previous retail prices for one-time recovery; historical orders remain unchanged.
CREATE TABLE IF NOT EXISTS public.vinyl_repricing_history (
  change_key text NOT NULL,
  kind text NOT NULL CHECK(kind IN ('product','variant')),
  product_id integer NOT NULL,
  variant_key text NOT NULL DEFAULT '',
  supplier_price numeric(12,2),
  previous_sale_price numeric(12,2),
  new_sale_price numeric(12,2),
  applied_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(change_key,kind,product_id,variant_key)
);
ALTER TABLE public.vinyl_repricing_history ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vinyl_repricing_history FROM PUBLIC,anon,authenticated;

DO $fixed_20_markup$
DECLARE key text:='supplier_plus_20_eur_20261012';
BEGIN
  IF EXISTS(SELECT 1 FROM public.vinyl_repricing_history WHERE change_key=key) THEN
    RAISE EXCEPTION 'This EUR 20 retail correction has already been applied';
  END IF;
  INSERT INTO public.vinyl_repricing_history
    (change_key,kind,product_id,variant_key,supplier_price,previous_sale_price,new_sale_price)
  SELECT key,'product',p.id,'',c.supplier_price,p.sale_price,
      CASE WHEN c.supplier_price IS NULL THEN NULL ELSE round(c.supplier_price+20.00,2) END
  FROM public.vinyl_products p LEFT JOIN public.vinyl_costs c ON c.product_id=p.id;
  INSERT INTO public.vinyl_repricing_history
    (change_key,kind,product_id,variant_key,supplier_price,previous_sale_price,new_sale_price)
  SELECT key,'variant',product_id,variant_key,supplier_price,sale_price,
    CASE WHEN supplier_price IS NULL THEN NULL ELSE round(supplier_price+20.00,2) END
  FROM public.vinyl_variants;

  UPDATE public.vinyl_products p
  SET sale_price=CASE WHEN c.supplier_price IS NULL THEN NULL ELSE round(c.supplier_price+20.00,2) END,updated_at=now()
  FROM public.vinyl_costs c WHERE p.id=c.product_id;
  UPDATE public.vinyl_variants v
  SET sale_price=CASE WHEN supplier_price IS NULL THEN NULL ELSE round(supplier_price+20.00,2) END;
END $fixed_20_markup$;