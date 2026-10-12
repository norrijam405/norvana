CREATE TABLE IF NOT EXISTS demand_observations (
  id serial PRIMARY KEY,
  subject_type varchar(40) NOT NULL,
  subject_key varchar(255) NOT NULL,
  internal_requests integer,
  sell_through_rate real,
  repeat_purchase_rate real,
  search_trend_index real,
  customer_voice_score real,
  velocity_index real,
  sample_size integer,
  evidence_ref varchar(1500) NOT NULL,
  observed_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS demand_observations_subject_time_idx
  ON demand_observations (subject_type, subject_key, observed_at);

CREATE TABLE IF NOT EXISTS delivery_observations (
  id serial PRIMARY KEY,
  route_id integer,
  supplier_id integer,
  carrier varchar(120) NOT NULL DEFAULT '',
  service_level varchar(120) NOT NULL DEFAULT '',
  origin_region varchar(160) NOT NULL DEFAULT '',
  destination_region varchar(160) NOT NULL DEFAULT '',
  handling_hours integer NOT NULL DEFAULT 0 CHECK (handling_hours >= 0),
  transit_hours integer NOT NULL DEFAULT 0 CHECK (transit_hours >= 0),
  promised_hours integer CHECK (promised_hours IS NULL OR promised_hours >= 0),
  delivered_on_time boolean NOT NULL DEFAULT false,
  lost boolean NOT NULL DEFAULT false,
  damaged boolean NOT NULL DEFAULT false,
  tracking_gap_hours integer CHECK (tracking_gap_hours IS NULL OR tracking_gap_hours >= 0),
  evidence_ref varchar(1500) NOT NULL,
  observed_at timestamp NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_observations_route_time_idx
  ON delivery_observations (route_id, observed_at);
CREATE INDEX IF NOT EXISTS delivery_observations_supplier_geo_idx
  ON delivery_observations (supplier_id, carrier, destination_region, observed_at);

CREATE TABLE IF NOT EXISTS darwin_evaluations (
  id serial PRIMARY KEY,
  subject_type varchar(40) NOT NULL,
  subject_key varchar(255) NOT NULL,
  candidate_key varchar(255) NOT NULL,
  policy_version varchar(80) NOT NULL DEFAULT 'DARWIN_R0',
  eligible boolean NOT NULL,
  fitness_score integer NOT NULL CHECK (fitness_score >= 0 AND fitness_score <= 100),
  rejection_codes json NOT NULL DEFAULT '[]'::json,
  economics json NOT NULL DEFAULT '{}'::json,
  demand json NOT NULL DEFAULT '{}'::json,
  delivery json NOT NULL DEFAULT '{}'::json,
  risks json NOT NULL DEFAULT '{}'::json,
  evidence_refs json NOT NULL DEFAULT '[]'::json,
  evaluated_at timestamp NOT NULL DEFAULT now(),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS darwin_evaluations_subject_time_idx
  ON darwin_evaluations (subject_type, subject_key, evaluated_at);
CREATE INDEX IF NOT EXISTS darwin_evaluations_candidate_time_idx
  ON darwin_evaluations (candidate_key, evaluated_at);

CREATE TABLE IF NOT EXISTS local_producers (
  id serial PRIMARY KEY,
  name varchar(255) NOT NULL UNIQUE,
  channel varchar(40) NOT NULL DEFAULT 'FARM',
  status varchar(40) NOT NULL DEFAULT 'PROSPECT',
  contact_name varchar(255),
  contact_email varchar(255),
  website varchar(1000),
  service_areas json NOT NULL DEFAULT '[]'::json,
  product_categories json NOT NULL DEFAULT '[]'::json,
  seasonal_notes text NOT NULL DEFAULT '',
  wholesale_available boolean NOT NULL DEFAULT false,
  minimum_order_cents integer CHECK (minimum_order_cents IS NULL OR minimum_order_cents >= 0),
  lead_time_hours integer CHECK (lead_time_hours IS NULL OR lead_time_hours >= 0),
  fulfillment_modes json NOT NULL DEFAULT '[]'::json,
  ships_nationally boolean NOT NULL DEFAULT false,
  cold_chain_required boolean NOT NULL DEFAULT false,
  current_delivery_days json NOT NULL DEFAULT '[]'::json,
  packaging_notes text NOT NULL DEFAULT '',
  insurance_notes text NOT NULL DEFAULT '',
  food_safety_notes text NOT NULL DEFAULT '',
  media_permission_status varchar(30) NOT NULL DEFAULT 'UNKNOWN',
  pilot_interest varchar(20) NOT NULL DEFAULT 'UNKNOWN',
  capacity_notes text NOT NULL DEFAULT '',
  payment_preference text NOT NULL DEFAULT '',
  biggest_pain_point text NOT NULL DEFAULT '',
  evidence_refs json NOT NULL DEFAULT '[]'::json,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS local_producers_name_idx
  ON local_producers (name);

CREATE OR REPLACE FUNCTION reject_intelligence_observation_mutation()
RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'intelligence observations and evaluations are append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS demand_observations_reject_mutation ON demand_observations;
CREATE TRIGGER demand_observations_reject_mutation
BEFORE UPDATE OR DELETE ON demand_observations
FOR EACH ROW EXECUTE FUNCTION reject_intelligence_observation_mutation();

DROP TRIGGER IF EXISTS delivery_observations_reject_mutation ON delivery_observations;
CREATE TRIGGER delivery_observations_reject_mutation
BEFORE UPDATE OR DELETE ON delivery_observations
FOR EACH ROW EXECUTE FUNCTION reject_intelligence_observation_mutation();

DROP TRIGGER IF EXISTS darwin_evaluations_reject_mutation ON darwin_evaluations;
CREATE TRIGGER darwin_evaluations_reject_mutation
BEFORE UPDATE OR DELETE ON darwin_evaluations
FOR EACH ROW EXECUTE FUNCTION reject_intelligence_observation_mutation();
