-- The production decision-token function records its decision timestamp.
-- Some production databases predate the applications extension migration.
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
