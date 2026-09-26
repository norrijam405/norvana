ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS bootstrap_derived boolean NOT NULL DEFAULT true;
