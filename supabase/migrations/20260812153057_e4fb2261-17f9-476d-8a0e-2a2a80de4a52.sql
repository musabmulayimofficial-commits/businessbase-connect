
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT '',
  sector TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  entrepreneurship_status TEXT NOT NULL DEFAULT '',
  skills TEXT[] NOT NULL DEFAULT '{}',
  interests TEXT[] NOT NULL DEFAULT '{}',
  notify_connections BOOLEAN NOT NULL DEFAULT true,
  notify_messages BOOLEAN NOT NULL DEFAULT true,
  notify_events BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE INDEX profiles_city_idx ON public.profiles(city);
CREATE INDEX profiles_sector_idx ON public.profiles(sector);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  profession TEXT NOT NULL,
  entrepreneurship_status TEXT NOT NULL,
  motivation TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.applications TO anon, authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "applications_insert_any" ON public.applications FOR INSERT WITH CHECK (true);

CREATE TABLE public.connection_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_request CHECK (sender_id <> receiver_id),
  CONSTRAINT unique_pair UNIQUE (sender_id, receiver_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connection_requests TO authenticated;
GRANT ALL ON public.connection_requests TO service_role;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_read_own" ON public.connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "cr_insert_own" ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND sender_id <> receiver_id);
CREATE POLICY "cr_update_party" ON public.connection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "cr_delete_party" ON public.connection_requests FOR DELETE TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE INDEX cr_receiver_idx ON public.connection_requests(receiver_id, status);
CREATE INDEX cr_sender_idx ON public.connection_requests(sender_id, status);
CREATE TRIGGER cr_updated_at BEFORE UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conn_order CHECK (user_a < user_b),
  CONSTRAINT conn_unique UNIQUE (user_a, user_b)
);
GRANT SELECT, DELETE ON public.connections TO authenticated;
GRANT ALL ON public.connections TO service_role;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn_read_own" ON public.connections FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "conn_delete_own" ON public.connections FOR DELETE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE INDEX connections_a_idx ON public.connections(user_a);
CREATE INDEX connections_b_idx ON public.connections(user_b);

CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT conv_order CHECK (user_a < user_b),
  CONSTRAINT conv_unique UNIQUE (user_a, user_b)
);
GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conv_read_own" ON public.conversations FOR SELECT TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "conv_insert_own" ON public.conversations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);
CREATE POLICY "conv_update_own" ON public.conversations FOR UPDATE TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b)
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_conversation_member(_conversation_id UUID, _user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.conversations c
    WHERE c.id = _conversation_id AND (c.user_a = _user_id OR c.user_b = _user_id));
$$;
CREATE POLICY "msg_read_member" ON public.messages FOR SELECT TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "msg_insert_member" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id AND public.is_conversation_member(conversation_id, auth.uid()));
CREATE POLICY "msg_update_member" ON public.messages FOR UPDATE TO authenticated
  USING (public.is_conversation_member(conversation_id, auth.uid()))
  WITH CHECK (public.is_conversation_member(conversation_id, auth.uid()));
CREATE INDEX messages_conv_idx ON public.messages(conversation_id, created_at DESC);

CREATE TABLE public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.opportunities TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.opportunities TO authenticated;
GRANT ALL ON public.opportunities TO service_role;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opp_public_read" ON public.opportunities FOR SELECT USING (true);
CREATE POLICY "opp_insert_own" ON public.opportunities FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "opp_update_own" ON public.opportunities FOR UPDATE TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);
CREATE POLICY "opp_delete_own" ON public.opportunities FOR DELETE TO authenticated USING (auth.uid() = created_by);
CREATE INDEX opp_category_idx ON public.opportunities(category);
CREATE TRIGGER opp_updated_at BEFORE UPDATE ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL DEFAULT '19:00',
  location TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  organizer_name TEXT NOT NULL DEFAULT 'BusinessBase',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events_public_read" ON public.events FOR SELECT USING (true);
CREATE POLICY "events_insert_own" ON public.events FOR INSERT TO authenticated WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "events_update_own" ON public.events FOR UPDATE TO authenticated USING (auth.uid() = organizer_id) WITH CHECK (auth.uid() = organizer_id);
CREATE POLICY "events_delete_own" ON public.events FOR DELETE TO authenticated USING (auth.uid() = organizer_id);
CREATE INDEX events_date_idx ON public.events(event_date);

CREATE TABLE public.event_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT event_participant_unique UNIQUE (event_id, user_id)
);
GRANT SELECT ON public.event_participants TO anon;
GRANT SELECT, INSERT, DELETE ON public.event_participants TO authenticated;
GRANT ALL ON public.event_participants TO service_role;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ep_public_read" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "ep_insert_own" ON public.event_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ep_delete_own" ON public.event_participants FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX ep_event_idx ON public.event_participants(event_id);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_read_own" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notif_update_own" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notif_delete_own" ON public.notifications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX notif_user_idx ON public.notifications(user_id, is_read, created_at DESC);

CREATE OR REPLACE FUNCTION public.notify_connection_request()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE sender_name TEXT;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
  VALUES (NEW.receiver_id, 'connection_request', 'Yeni bağlantı isteği',
    COALESCE(NULLIF(sender_name,''),'Bir üye') || ' sana bağlantı isteği gönderdi.',
    '/baglantilarim', NEW.sender_id, NEW.id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_connection_request AFTER INSERT ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.notify_connection_request();

CREATE OR REPLACE FUNCTION public.handle_connection_accept()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE receiver_name TEXT;
BEGIN
  IF NEW.status = 'accepted' AND OLD.status <> 'accepted' THEN
    INSERT INTO public.connections (user_a, user_b)
    VALUES (LEAST(NEW.sender_id, NEW.receiver_id), GREATEST(NEW.sender_id, NEW.receiver_id))
    ON CONFLICT DO NOTHING;
    INSERT INTO public.conversations (user_a, user_b)
    VALUES (LEAST(NEW.sender_id, NEW.receiver_id), GREATEST(NEW.sender_id, NEW.receiver_id))
    ON CONFLICT DO NOTHING;
    SELECT full_name INTO receiver_name FROM public.profiles WHERE id = NEW.receiver_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
    VALUES (NEW.sender_id, 'connection_accepted', 'Bağlantı isteğin kabul edildi',
      COALESCE(NULLIF(receiver_name,''),'Bir üye') || ' bağlantı isteğini kabul etti.',
      '/baglantilarim', NEW.receiver_id, NEW.id);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_handle_connection_accept AFTER UPDATE ON public.connection_requests
FOR EACH ROW EXECUTE FUNCTION public.handle_connection_accept();

CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE target UUID; sender_name TEXT;
BEGIN
  SELECT CASE WHEN c.user_a = NEW.sender_id THEN c.user_b ELSE c.user_a END INTO target
  FROM public.conversations c WHERE c.id = NEW.conversation_id;
  UPDATE public.conversations SET last_message_at = NEW.created_at WHERE id = NEW.conversation_id;
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
  VALUES (target, 'message', 'Yeni mesaj',
    COALESCE(NULLIF(sender_name,''),'Bir üye') || ' sana mesaj gönderdi.',
    '/mesajlar', NEW.sender_id, NEW.conversation_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_new_message AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

CREATE OR REPLACE FUNCTION public.notify_event_join()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ev RECORD; joiner TEXT;
BEGIN
  SELECT * INTO ev FROM public.events WHERE id = NEW.event_id;
  IF ev.organizer_id IS NOT NULL AND ev.organizer_id <> NEW.user_id THEN
    SELECT full_name INTO joiner FROM public.profiles WHERE id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, link, actor_id, entity_id)
    VALUES (ev.organizer_id, 'event', 'Etkinliğine yeni katılım',
      COALESCE(NULLIF(joiner,''),'Bir üye') || ' "' || ev.name || '" etkinliğine katıldı.',
      '/etkinlikler', NEW.user_id, NEW.event_id);
  END IF;
  INSERT INTO public.notifications (user_id, type, title, body, link, entity_id)
  VALUES (NEW.user_id, 'event', 'Etkinliğe katıldın',
    ev.name || ' — ' || to_char(ev.event_date, 'DD.MM.YYYY'), '/etkinlikler', NEW.event_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_event_join AFTER INSERT ON public.event_participants
FOR EACH ROW EXECUTE FUNCTION public.notify_event_join();

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

CREATE POLICY "avatars_public_read" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "avatars_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
