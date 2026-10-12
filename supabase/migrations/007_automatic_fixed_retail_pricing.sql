-- Preserve EUR 20 fixed addition on future admin edits and supplier syncs.
CREATE OR REPLACE FUNCTION public.vinyl_product_retail_plus_twenty()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
DECLARE cost numeric(12,2);
BEGIN
  SELECT c.supplier_price INTO cost FROM public.vinyl_costs c WHERE c.product_id=NEW.id;
  NEW.sale_price:=CASE WHEN cost IS NULL THEN NULL ELSE round(cost+20.00,2) END;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS vinyl_retail_from_cost_on_products ON public.vinyl_products;
CREATE TRIGGER vinyl_retail_from_cost_on_products BEFORE INSERT OR UPDATE OF sale_price
 ON public.vinyl_products FOR EACH ROW EXECUTE FUNCTION public.vinyl_product_retail_plus_twenty();

CREATE OR REPLACE FUNCTION public.vinyl_update_product_retail_when_cost_changes()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  UPDATE public.vinyl_products p SET
    sale_price=CASE WHEN NEW.supplier_price IS NULL THEN NULL ELSE round(NEW.supplier_price+20.00,2) END,
    updated_at=now() WHERE p.id=NEW.product_id;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS vinyl_retail_when_supplier_cost_changed ON public.vinyl_costs;
CREATE TRIGGER vinyl_retail_when_supplier_cost_changed AFTER INSERT OR UPDATE OF supplier_price
 ON public.vinyl_costs FOR EACH ROW EXECUTE FUNCTION public.vinyl_update_product_retail_when_cost_changes();

CREATE OR REPLACE FUNCTION public.vinyl_variant_retail_plus_twenty()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public,pg_temp AS $$
BEGIN
  NEW.sale_price:=CASE WHEN NEW.supplier_price IS NULL THEN NULL ELSE round(NEW.supplier_price+20.00,2) END;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS vinyl_retail_from_cost_on_variants ON public.vinyl_variants;
CREATE TRIGGER vinyl_retail_from_cost_on_variants BEFORE INSERT OR UPDATE OF supplier_price,sale_price
 ON public.vinyl_variants FOR EACH ROW EXECUTE FUNCTION public.vinyl_variant_retail_plus_twenty();