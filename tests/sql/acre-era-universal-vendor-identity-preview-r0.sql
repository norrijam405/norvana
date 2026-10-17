-- UVQ-B: ephemeral provider identity challenge, against a Preview schema with migration 0021 applied.
-- Executes inside the active Neon session only. No permanent products inserted.
DO $uvq$
DECLARE n integer; blocked boolean;
BEGIN
  CREATE TEMP TABLE uvq_products (LIKE public.products INCLUDING ALL) ON COMMIT DROP;
  INSERT INTO uvq_products (name, slug, price, status, source_provider_slug, supplier_sku, external_product_id)
  VALUES
  ('Synthetic A', 'uvq-test-a', 0, 'staged', 'synthetic-a', 'OVERLAP-001', 'EXT-OVERLAP'),
  ('Synthetic B', 'uvq-test-b', 0, 'staged', 'synthetic-b', 'OVERLAP-001', 'EXT-OVERLAP');
  SELECT count(*) INTO n FROM uvq_products WHERE supplier_sku = 'OVERLAP-001';
  IF n <> 2 THEN RAISE EXCEPTION 'different vendors must coexist with the same SKU'; END IF;
  blocked := false;
  BEGIN
    INSERT INTO uvq_products (name, slug, price, status, source_provider_slug, supplier_sku)
    VALUES ('Duplicate A', 'uvq-test-duplicate-a', 0, 'staged', 'synthetic-a', 'OVERLAP-001');
  EXCEPTION WHEN unique_violation THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'same-vendor SKU conflict not rejected'; END IF;
  blocked := false;
  BEGIN
    INSERT INTO uvq_products (name, slug, price, status, source_provider_slug, external_product_id)
    VALUES ('Duplicate External', 'uvq-test-duplicate-ext', 0, 'staged', 'synthetic-b', 'EXT-OVERLAP');
  EXCEPTION WHEN unique_violation THEN blocked := true;
  END;
  IF NOT blocked THEN RAISE EXCEPTION 'same-vendor external-id conflict not rejected'; END IF;
END $uvq$;
