-- Acre Era UVQ R0. Run only after confirming provider-key duplicate report is empty.
-- Two independent qualified remote identifiers; NULL provider is intentionally excluded.
CREATE UNIQUE INDEX IF NOT EXISTS products_provider_supplier_sku_unique
  ON public.products (source_provider_slug, supplier_sku)
  WHERE source_provider_slug IS NOT NULL AND supplier_sku IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_provider_external_id_unique
  ON public.products (source_provider_slug, external_product_id)
  WHERE source_provider_slug IS NOT NULL AND external_product_id IS NOT NULL;
