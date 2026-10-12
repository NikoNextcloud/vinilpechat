-- Retire automatic EUR 20 markup. Do not change any existing sales prices.
-- Supplier and retail prices may now be edited independently by the shop owner.
DROP TRIGGER IF EXISTS vinyl_retail_from_cost_on_products ON public.vinyl_products;
DROP TRIGGER IF EXISTS vinyl_retail_when_supplier_cost_changed ON public.vinyl_costs;
DROP TRIGGER IF EXISTS vinyl_retail_from_cost_on_variants ON public.vinyl_variants;
DROP FUNCTION IF EXISTS public.vinyl_product_retail_plus_twenty();
DROP FUNCTION IF EXISTS public.vinyl_update_product_retail_when_cost_changes();
DROP FUNCTION IF EXISTS public.vinyl_variant_retail_plus_twenty();
