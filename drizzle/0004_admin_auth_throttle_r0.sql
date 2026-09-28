CREATE TABLE IF NOT EXISTS admin_auth_throttle (
  key_hash varchar(64) PRIMARY KEY,
  action varchar(30) NOT NULL,
  window_started_at timestamp NOT NULL,
  failure_count integer NOT NULL DEFAULT 0,
  blocked_until timestamp,
  updated_at timestamp NOT NULL DEFAULT now()
);
