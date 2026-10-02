ALTER TABLE reviews
  ADD COLUMN IF NOT EXISTS buyer_type varchar(30) NOT NULL DEFAULT 'INDIVIDUAL',
  ADD COLUMN IF NOT EXISTS business_name varchar(255),
  ADD COLUMN IF NOT EXISTS fulfillment_rating integer,
  ADD COLUMN IF NOT EXISTS purchase_experience_rating integer,
  ADD COLUMN IF NOT EXISTS purchase_quantity_band varchar(30),
  ADD COLUMN IF NOT EXISTS repeat_buyer boolean,
  ADD COLUMN IF NOT EXISTS verification_state varchar(40) NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS moderation_state varchar(30) NOT NULL DEFAULT 'PUBLISHED',
  ADD COLUMN IF NOT EXISTS source_channel varchar(60) NOT NULL DEFAULT 'NORVANA',
  ADD COLUMN IF NOT EXISTS source_label varchar(255) NOT NULL DEFAULT 'Norvana',
  ADD COLUMN IF NOT EXISTS source_order_id integer,
  ADD COLUMN IF NOT EXISTS source_review_id varchar(255),
  ADD COLUMN IF NOT EXISTS source_url varchar(1000),
  ADD COLUMN IF NOT EXISTS helpful_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS not_helpful_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamp NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS reviews_verified_order_product_idx
  ON reviews (product_id, source_order_id)
  WHERE source_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS reviews_external_source_id_idx
  ON reviews (source_channel, source_label, source_review_id)
  WHERE source_review_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS review_events (
  id serial PRIMARY KEY,
  review_id integer NOT NULL,
  event_type varchar(60) NOT NULL,
  payload json NOT NULL DEFAULT '{}'::json,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS review_events_review_id_idx
  ON review_events (review_id, id);

CREATE TABLE IF NOT EXISTS review_reactions (
  id serial PRIMARY KEY,
  review_id integer NOT NULL,
  actor_key_hash varchar(64) NOT NULL,
  reaction varchar(30) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS review_reactions_review_actor_idx
  ON review_reactions (review_id, actor_key_hash);

CREATE INDEX IF NOT EXISTS review_reactions_review_id_idx
  ON review_reactions (review_id);

CREATE TABLE IF NOT EXISTS customer_voice_throttle (
  key_hash varchar(64) NOT NULL,
  action varchar(30) NOT NULL,
  window_started_at timestamp NOT NULL,
  request_count integer NOT NULL DEFAULT 0,
  updated_at timestamp NOT NULL DEFAULT now(),
  PRIMARY KEY (key_hash, action)
);
