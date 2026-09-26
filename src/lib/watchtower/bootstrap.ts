import { sql } from "drizzle-orm";
import { db } from "@/db";
import { watchJobs } from "@/db/schema";
import { WATCHTOWER_JOB_TEMPLATES } from "@/lib/watchtower/default-jobs";

const WATCHTOWER_DDL = `
CREATE TABLE IF NOT EXISTS watch_jobs (
  id serial PRIMARY KEY,
  slug varchar(120) NOT NULL UNIQUE,
  name varchar(255) NOT NULL,
  category varchar(80) NOT NULL DEFAULT 'general',
  description text NOT NULL DEFAULT '',
  instructions text NOT NULL DEFAULT '',
  authority varchar(30) NOT NULL DEFAULT 'OBSERVE',
  status varchar(30) NOT NULL DEFAULT 'PAUSED',
  cadence_minutes integer NOT NULL DEFAULT 1440,
  budget_cents integer NOT NULL DEFAULT 0,
  notify_on_material_only boolean NOT NULL DEFAULT true,
  source_policy json NOT NULL DEFAULT '{}'::json,
  next_run_at timestamp,
  last_run_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watch_runs (
  id serial PRIMARY KEY,
  job_id integer NOT NULL,
  status varchar(30) NOT NULL DEFAULT 'QUEUED',
  trigger varchar(30) NOT NULL DEFAULT 'SCHEDULE',
  summary text NOT NULL DEFAULT '',
  findings json NOT NULL DEFAULT '[]'::json,
  evidence_refs json NOT NULL DEFAULT '[]'::json,
  model_provider varchar(100),
  estimated_cost_cents integer NOT NULL DEFAULT 0,
  error_message text,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS watch_candidates (
  id serial PRIMARY KEY,
  job_id integer NOT NULL,
  run_id integer,
  title varchar(255) NOT NULL,
  lane varchar(60) NOT NULL DEFAULT 'general',
  source_name varchar(255) NOT NULL DEFAULT '',
  source_url varchar(1000) NOT NULL DEFAULT '',
  source_country varchar(100),
  truth_state varchar(60) NOT NULL DEFAULT 'DISCOVERED',
  economics json NOT NULL DEFAULT '{}'::json,
  risk_flags json NOT NULL DEFAULT '[]'::json,
  evidence json NOT NULL DEFAULT '[]'::json,
  recommendation text NOT NULL DEFAULT '',
  status varchar(30) NOT NULL DEFAULT 'NEW',
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS action_receipts (
  id serial PRIMARY KEY,
  action_type varchar(100) NOT NULL,
  authority_class varchar(30) NOT NULL DEFAULT 'OBSERVE',
  subject_type varchar(80) NOT NULL DEFAULT 'watchtower',
  subject_id varchar(255) NOT NULL DEFAULT '',
  status varchar(30) NOT NULL,
  actor varchar(120) NOT NULL DEFAULT 'norvana',
  details json NOT NULL DEFAULT '{}'::json,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS watch_runs_job_id_idx ON watch_runs(job_id);
CREATE INDEX IF NOT EXISTS watch_candidates_job_id_idx ON watch_candidates(job_id);
CREATE INDEX IF NOT EXISTS watch_candidates_status_idx ON watch_candidates(status);
CREATE INDEX IF NOT EXISTS action_receipts_subject_idx ON action_receipts(subject_type, subject_id);
`;

export async function bootstrapWatchtower() {
  await db.execute(sql.raw(WATCHTOWER_DDL));

  for (const template of WATCHTOWER_JOB_TEMPLATES) {
    await db
      .insert(watchJobs)
      .values({
        slug: template.slug,
        name: template.name,
        category: template.category,
        description: template.description,
        instructions: template.instructions,
        authority: template.authority,
        status: "PAUSED",
        cadenceMinutes: template.cadenceMinutes,
        budgetCents: template.budgetCents,
        sourcePolicy: template.sourcePolicy,
      })
      .onConflictDoNothing({ target: watchJobs.slug });
  }
}
