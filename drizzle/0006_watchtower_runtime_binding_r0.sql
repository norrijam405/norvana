-- Bind Watchtower proofs and executable runs to the deployment/runtime
-- that created them. Existing rows remain unbound and cannot satisfy
-- deployment-scoped proof gates.
ALTER TABLE watch_runs
  ADD COLUMN IF NOT EXISTS runtime_id varchar(255);
