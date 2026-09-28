-- Existing owner rows predate explicit bootstrap-state tracking.
-- Treat them as durable/rotated credentials on migration; new bootstrap-created
-- owners are explicitly written with bootstrap_derived=true by application code.
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS bootstrap_derived boolean NOT NULL DEFAULT false;
