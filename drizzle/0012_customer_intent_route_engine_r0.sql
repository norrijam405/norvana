ALTER TABLE market_requests
  ADD COLUMN IF NOT EXISTS status_evidence_ref varchar(1500),
  ADD COLUMN IF NOT EXISTS watchtower_candidate_id integer;

CREATE TABLE IF NOT EXISTS market_request_events (
  id serial PRIMARY KEY,
  market_request_id integer NOT NULL,
  event_type varchar(60) NOT NULL,
  from_status varchar(30),
  to_status varchar(30),
  evidence_ref varchar(1500),
  public_note text NOT NULL DEFAULT '',
  actor varchar(120) NOT NULL DEFAULT 'system',
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS market_request_events_request_created_idx
  ON market_request_events (market_request_id, created_at);

CREATE TABLE IF NOT EXISTS customer_watch_items (
  id serial PRIMARY KEY,
  actor_key_hash varchar(64) NOT NULL,
  target_type varchar(30) NOT NULL,
  target_key varchar(255) NOT NULL,
  alert_types json NOT NULL DEFAULT '[]'::json,
  price_threshold_cents integer,
  status varchar(30) NOT NULL DEFAULT 'ACTIVE',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT customer_watch_items_actor_target_unique
    UNIQUE (actor_key_hash, target_type, target_key)
);

CREATE TABLE IF NOT EXISTS customer_alert_events (
  id serial PRIMARY KEY,
  watch_item_id integer NOT NULL,
  event_type varchar(60) NOT NULL,
  payload json NOT NULL DEFAULT '{}'::json,
  status varchar(30) NOT NULL DEFAULT 'PENDING',
  created_at timestamp NOT NULL DEFAULT now(),
  delivered_at timestamp
);

CREATE INDEX IF NOT EXISTS customer_alert_events_watch_created_idx
  ON customer_alert_events (watch_item_id, created_at);

CREATE TABLE IF NOT EXISTS product_routes (
  id serial PRIMARY KEY,
  product_id integer NOT NULL,
  route_type varchar(50) NOT NULL,
  provider_slug varchar(120),
  seller_name varchar(255) NOT NULL,
  checkout_owner varchar(30) NOT NULL,
  checkout_url varchar(1500),
  currency varchar(10) NOT NULL DEFAULT 'USD',
  product_condition varchar(40) NOT NULL DEFAULT 'NEW',
  item_price_cents integer NOT NULL,
  shipping_cents integer NOT NULL DEFAULT 0,
  estimated_tax_cents integer,
  total_customer_price_cents integer NOT NULL,
  delivery_min_days integer,
  delivery_max_days integer,
  warranty_summary text NOT NULL DEFAULT '',
  return_summary text NOT NULL DEFAULT '',
  authorization_state varchar(60) NOT NULL DEFAULT 'UNVERIFIED',
  provenance_state varchar(60) NOT NULL DEFAULT 'UNVERIFIED',
  status varchar(30) NOT NULL DEFAULT 'QUALIFYING',
  evidence_ref varchar(1500),
  last_verified_at timestamp,
  internal_contribution_cents integer,
  internal_contribution_margin_bps integer,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_routes_product_status_idx
  ON product_routes (product_id, status);

CREATE TABLE IF NOT EXISTS product_route_observations (
  id serial PRIMARY KEY,
  route_id integer NOT NULL,
  item_price_cents integer NOT NULL,
  shipping_cents integer NOT NULL DEFAULT 0,
  estimated_tax_cents integer,
  total_customer_price_cents integer NOT NULL,
  stock_state varchar(40) NOT NULL DEFAULT 'UNKNOWN',
  delivery_min_days integer,
  delivery_max_days integer,
  source_digest varchar(128),
  evidence_ref varchar(1500),
  observed_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS product_route_observations_route_observed_idx
  ON product_route_observations (route_id, observed_at);
