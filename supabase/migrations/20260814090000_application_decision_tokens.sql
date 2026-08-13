-- Email decision links are stored as SHA-256 digests, never as raw tokens.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE public.application_decision_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id bigint NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX application_decision_tokens_pending_idx
  ON public.application_decision_tokens (application_id, expires_at)
  WHERE consumed_at IS NULL;

ALTER TABLE public.application_decision_tokens ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.application_decision_tokens TO service_role;

-- Atomically validates, consumes and applies an email decision.  A consumed or
-- expired token returns no rows, so callers cannot make a second decision.
CREATE OR REPLACE FUNCTION public.consume_application_decision_token(token text)
RETURNS TABLE (
  application_id bigint,
  decision text,
  full_name text,
  email text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  matched_token public.application_decision_tokens%ROWTYPE;
  updated_application public.applications%ROWTYPE;
BEGIN
  SELECT * INTO matched_token
  FROM public.application_decision_tokens
  WHERE token_hash = encode(digest(token, 'sha256'), 'hex')
    AND consumed_at IS NULL
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.application_decision_tokens
  SET consumed_at = now()
  WHERE id = matched_token.id;

  UPDATE public.applications
  SET status = matched_token.decision,
      reviewed_at = now()
  WHERE id = matched_token.application_id
    AND status IN ('pending', 'manual_review')
  RETURNING * INTO updated_application;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.application_decision_tokens
  SET consumed_at = now()
  WHERE application_id = matched_token.application_id
    AND consumed_at IS NULL;

  application_id := updated_application.id;
  decision := matched_token.decision;
  full_name := updated_application.full_name;
  email := updated_application.email;
  status := updated_application.status;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_application_decision_token(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_application_decision_token(text) TO service_role;
