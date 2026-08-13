CREATE TABLE public.networks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  invite_code TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL DEFAULT '',
  is_private BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.networks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.networks TO authenticated;
GRANT ALL ON public.networks TO service_role;
ALTER TABLE public.networks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "networks_public_read" ON public.networks
  FOR SELECT USING (true);

CREATE POLICY "networks_insert_own" ON public.networks
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "networks_update_own" ON public.networks
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "networks_delete_own" ON public.networks
  FOR DELETE TO authenticated
  USING (auth.uid() = owner_id);

CREATE INDEX networks_owner_idx ON public.networks(owner_id);
CREATE INDEX networks_slug_idx ON public.networks(slug);

CREATE TRIGGER networks_updated_at BEFORE UPDATE ON public.networks
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.network_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  network_id UUID NOT NULL REFERENCES public.networks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT network_member_unique UNIQUE (network_id, user_id)
);

GRANT SELECT, INSERT, DELETE ON public.network_members TO authenticated;
GRANT ALL ON public.network_members TO service_role;
ALTER TABLE public.network_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "network_members_public_read" ON public.network_members
  FOR SELECT USING (true);

CREATE POLICY "network_members_join_self" ON public.network_members
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "network_members_leave_self" ON public.network_members
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX network_members_network_idx ON public.network_members(network_id);
CREATE INDEX network_members_user_idx ON public.network_members(user_id);

INSERT INTO public.networks (owner_id, name, slug, invite_code, description, is_private)
SELECT p.id,
       'BusinessBase Admin Network',
       'musab',
       'MUSAB',
       'BusinessBase kurucusunun özel davet ağı.',
       true
FROM public.profiles p
WHERE lower(p.full_name) = lower('Musab Mülayim')
  AND NOT EXISTS (SELECT 1 FROM public.networks n WHERE n.slug = 'musab')
LIMIT 1;

INSERT INTO public.network_members (network_id, user_id, role)
SELECT n.id, n.owner_id, 'owner'
FROM public.networks n
WHERE n.slug = 'musab'
  AND NOT EXISTS (
    SELECT 1 FROM public.network_members nm
    WHERE nm.network_id = n.id AND nm.user_id = n.owner_id
  );
