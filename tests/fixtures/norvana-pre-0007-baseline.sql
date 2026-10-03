-- Norvana/Acre Era migration-chain test baseline.
--
-- The numbered recovery migrations start after the original storefront schema
-- already had products and reviews. This fixture intentionally models only the
-- legacy objects that later numbered migrations depend on. It is NOT a
-- production bootstrap or a replacement for the canonical application schema.

CREATE TABLE products (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  price real NOT NULL,
  compare_at_price real,
  cost real DEFAULT 0,
  niche varchar(100) NOT NULL DEFAULT 'general',
  volume_number integer NOT NULL DEFAULT 1,
  status varchar(50) NOT NULL DEFAULT 'active',
  supplier_id integer,
  supplier_sku varchar(100),
  images json NOT NULL DEFAULT '[]'::json,
  rating real NOT NULL DEFAULT 0,
  review_count integer NOT NULL DEFAULT 0,
  inventory integer NOT NULL DEFAULT 100,
  tags json NOT NULL DEFAULT '[]'::json,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE reviews (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  author varchar(255) NOT NULL,
  rating integer NOT NULL,
  title varchar(255) NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  verified boolean NOT NULL DEFAULT false,
  created_at timestamp NOT NULL DEFAULT now()
);
