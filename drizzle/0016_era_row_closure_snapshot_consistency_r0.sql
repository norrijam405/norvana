-- AE-LRP-R0-FRC-02 remediation:
-- Any mutation of an eras column serialized into the immutable CLOSURE
-- snapshot must advance the same Era-level content_revision used by closeEra.
-- This is database-enforced so direct SQL cannot bypass closure consistency by
-- omitting updated_at or by avoiding application write paths.
--
-- Snapshot-contributing eras columns:
-- id, slug, name, eyebrow, story, kind, lifecycle_state, visibility,
-- is_primary, start_at, end_at, theme_tokens, archive_policy,
-- content_revision, created_at, updated_at.
--
-- watchtower_profile is intentionally excluded because archive.ts does not
-- serialize it into ACRE_ERA_ARCHIVE_SNAPSHOT_R0. content_revision itself is
-- already an explicit closure CAS operand and therefore does not need to fire
-- this trigger merely for changing itself.

CREATE OR REPLACE FUNCTION bump_era_content_revision_from_snapshot_fields()
RETURNS trigger AS $$
BEGIN
  IF
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.slug IS DISTINCT FROM OLD.slug OR
    NEW.name IS DISTINCT FROM OLD.name OR
    NEW.eyebrow IS DISTINCT FROM OLD.eyebrow OR
    NEW.story IS DISTINCT FROM OLD.story OR
    NEW.kind IS DISTINCT FROM OLD.kind OR
    NEW.lifecycle_state IS DISTINCT FROM OLD.lifecycle_state OR
    NEW.visibility IS DISTINCT FROM OLD.visibility OR
    NEW.is_primary IS DISTINCT FROM OLD.is_primary OR
    NEW.start_at IS DISTINCT FROM OLD.start_at OR
    NEW.end_at IS DISTINCT FROM OLD.end_at OR
    NEW.theme_tokens::text IS DISTINCT FROM OLD.theme_tokens::text OR
    NEW.archive_policy::text IS DISTINCT FROM OLD.archive_policy::text OR
    NEW.created_at IS DISTINCT FROM OLD.created_at OR
    NEW.updated_at IS DISTINCT FROM OLD.updated_at
  THEN
    -- Preserve monotonicity even if a caller also supplies content_revision.
    NEW.content_revision :=
      GREATEST(NEW.content_revision, OLD.content_revision + 1);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS eras_bump_content_revision_on_snapshot_fields ON eras;
CREATE TRIGGER eras_bump_content_revision_on_snapshot_fields
BEFORE UPDATE OF
  id,
  slug,
  name,
  eyebrow,
  story,
  kind,
  lifecycle_state,
  visibility,
  is_primary,
  start_at,
  end_at,
  theme_tokens,
  archive_policy,
  created_at,
  updated_at
ON eras
FOR EACH ROW
EXECUTE FUNCTION bump_era_content_revision_from_snapshot_fields();
