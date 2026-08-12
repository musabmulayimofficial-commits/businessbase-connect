
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_connection_request() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.handle_connection_accept() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.notify_event_join() FROM anon, authenticated, public;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(UUID, UUID) FROM anon, public;
