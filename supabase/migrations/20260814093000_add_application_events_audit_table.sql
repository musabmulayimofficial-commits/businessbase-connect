-- Production applications.id is bigint.  The historical application_events
-- migration used uuid, so it could not be applied to this schema.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.application_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id bigint NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  actor text NOT NULL DEFAULT 'system',
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  decision text NOT NULL,
  score integer,
  reason text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS application_events_application_created_at_idx
  ON public.application_events (application_id, created_at DESC);

ALTER TABLE public.application_events ENABLE ROW LEVEL SECURITY;

-- Server-side audit writes use the service-role client, which bypasses RLS.
GRANT ALL ON TABLE public.application_events TO service_role;
GRANT SELECT ON TABLE public.application_events TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'application_events'
      AND policyname = 'application_events_admin_read'
  ) THEN
    CREATE POLICY "application_events_admin_read"
      ON public.application_events
      FOR SELECT TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
