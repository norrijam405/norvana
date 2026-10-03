CREATE TABLE IF NOT EXISTS eras (
  id serial PRIMARY KEY,
  slug varchar(180) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  eyebrow varchar(160) NOT NULL DEFAULT '',
  story text NOT NULL DEFAULT '',
  kind varchar(40) NOT NULL DEFAULT 'CATEGORY',
  lifecycle_state varchar(40) NOT NULL DEFAULT 'DRAFT',
  visibility varchar(30) NOT NULL DEFAULT 'PRIVATE',
  is_primary boolean NOT NULL DEFAULT false,
  start_at timestamp,
  end_at timestamp,
  theme_tokens json NOT NULL DEFAULT '{}'::json,
  watchtower_profile json NOT NULL DEFAULT '{}'::json,
  archive_policy json NOT NULL DEFAULT '{}'::json,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS eras_single_active_primary_idx
  ON eras (is_primary)
  WHERE is_primary = true AND lifecycle_state = 'ACTIVE';

CREATE TABLE IF NOT EXISTS era_media_assets (
  id serial PRIMARY KEY,
  era_id integer NOT NULL,
  asset_type varchar(50) NOT NULL,
  media_url varchar(1500) NOT NULL,
  poster_url varchar(1500),
  rights_state varchar(60) NOT NULL DEFAULT 'PENDING_VERIFICATION',
  rights_evidence_ref varchar(1500),
  source_label varchar(255),
  source_url varchar(1500),
  brand_name varchar(255),
  provider_slug varchar(120),
  rights_starts_at timestamp,
  rights_ends_at timestamp,
  status varchar(30) NOT NULL DEFAULT 'DRAFT',
  sha256 varchar(64),
  alt_text varchar(500) NOT NULL DEFAULT '',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS era_media_assets_era_id_idx
  ON era_media_assets (era_id);

CREATE TABLE IF NOT EXISTS era_sections (
  id serial PRIMARY KEY,
  era_id integer NOT NULL,
  section_type varchar(60) NOT NULL,
  position integer NOT NULL DEFAULT 0,
  config json NOT NULL DEFAULT '{}'::json,
  status varchar(30) NOT NULL DEFAULT 'ENABLED',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT era_sections_position_unique UNIQUE (era_id, position)
);

CREATE TABLE IF NOT EXISTS era_products (
  id serial PRIMARY KEY,
  era_id integer NOT NULL,
  product_id integer NOT NULL,
  position integer NOT NULL DEFAULT 0,
  role varchar(30) NOT NULL DEFAULT 'STANDARD',
  curation_reason text NOT NULL DEFAULT '',
  evidence_ref varchar(1500),
  status varchar(30) NOT NULL DEFAULT 'ACTIVE',
  assigned_at timestamp NOT NULL DEFAULT now(),
  removed_at timestamp,
  CONSTRAINT era_products_unique UNIQUE (era_id, product_id)
);

CREATE INDEX IF NOT EXISTS era_products_era_position_idx
  ON era_products (era_id, position);

CREATE TABLE IF NOT EXISTS era_watchtower_bindings (
  id serial PRIMARY KEY,
  era_id integer NOT NULL,
  watch_job_slug varchar(160) NOT NULL,
  importance integer NOT NULL DEFAULT 50,
  public_facet varchar(80),
  config json NOT NULL DEFAULT '{}'::json,
  created_at timestamp NOT NULL DEFAULT now(),
  CONSTRAINT era_watchtower_bindings_unique UNIQUE (era_id, watch_job_slug)
);

CREATE TABLE IF NOT EXISTS era_events (
  id serial PRIMARY KEY,
  era_id integer NOT NULL,
  event_type varchar(80) NOT NULL,
  actor varchar(120) NOT NULL DEFAULT 'system',
  payload json NOT NULL DEFAULT '{}'::json,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS era_events_era_created_idx
  ON era_events (era_id, created_at);
