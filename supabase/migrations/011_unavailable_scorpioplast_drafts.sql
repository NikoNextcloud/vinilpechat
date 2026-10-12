-- Keep currently unavailable Scorpioplast 100 g/m2 items as drafts.
-- Their individual supplier pages returned HTTP 404 during image import.
UPDATE public.vinyl_products
SET active=false,updated_at=now()
WHERE id BETWEEN 47 AND 52 AND category='scorpioplast-pokrivala' AND sale_price IS NULL;
UPDATE public.vinyl_supplier_reference
SET note='Историческа публикувана цена; продуктовата страница при доставчика връща 404 при проверката на 12.10.2026. Артикулът е неактивен до потвърждение.'
WHERE product_id BETWEEN 47 AND 52;
