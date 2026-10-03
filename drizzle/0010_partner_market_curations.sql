CREATE TABLE IF NOT EXISTS partner_collections (
  id serial PRIMARY KEY,
  slug varchar(160) NOT NULL UNIQUE,
  title varchar(255) NOT NULL,
  eyebrow varchar(120) NOT NULL DEFAULT 'Partner Finds',
  description text NOT NULL DEFAULT '',
  theme varchar(120) NOT NULL DEFAULT 'curated',
  hero_image varchar(1000),
  start_date varchar(50) NOT NULL DEFAULT '',
  end_date varchar(50) NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_collection_products (
  id serial PRIMARY KEY,
  collection_id integer NOT NULL,
  product_id integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT partner_collection_products_unique UNIQUE (collection_id, product_id)
);

CREATE INDEX IF NOT EXISTS partner_collection_products_collection_idx
  ON partner_collection_products(collection_id);

CREATE INDEX IF NOT EXISTS partner_collection_products_product_idx
  ON partner_collection_products(product_id);
