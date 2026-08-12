import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Check, Clock, MessageSquare, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { GlassButton } from "@/components/ui/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { ConnectionState } from "@/lib/types";

export function useConnectionState(targetId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["connection-state", user?.id, targetId],
    enabled: !!user,
    queryFn: async (): Promise<ConnectionState> => {
      const me = user!.id;
      if (me === targetId) return "self";
      const [a, b] = me < targetId ? [me, targetId] : [targetId, me];
      const { data: conn } = await supabase
        .from("connections")
        .select("id")
        .eq("user_a", a)
        .eq("user_b", b)
        .maybeSingle();
      if (conn) return "connected";
      const { data: req } = await supabase
        .from("connection_requests")
        .select("sender_id,status")
        .or(
          `and(sender_id.eq.${me},receiver_id.eq.${targetId}),and(sender_id.eq.${targetId},receiver_id.eq.${me})`,
        )
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!req) return "none";
      if (req.status === "pending") return req.sender_id === me ? "outgoing" : "incoming";
      if (req.status === "accepted") return "connected";
      return "none";
    },
  });
}

export async function openConversation(me: string, other: string) {
  const [a, b] = me < other ? [me, other] : [other, me];
  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_a", a)
    .eq("user_b", b)
    .maybeSingle();
  if (existing) return existing.id;
  const { data, error } = await supabase
    .from("conversations")
    .insert({ user_a: a, user_b: b })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

export function ConnectionButton({ targetId, full }: { targetId: string; full?: boolean }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: state, isLoading } = useConnectionState(targetId);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["connection-state", user?.id, targetId] });
    queryClient.invalidateQueries({ queryKey: ["connections"] });
    queryClient.invalidateQueries({ queryKey: ["connection-requests"] });
  };

  const sendRequest = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("connection_requests")
        .insert({ sender_id: user!.id, receiver_id: targetId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bağlantı isteği gönderildi.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const accept = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status: "accepted" })
        .eq("sender_id", targetId)
        .eq("receiver_id", user!.id)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Bağlantı kuruldu.");
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const message = useMutation({
    mutationFn: async () => openConversation(user!.id, targetId),
    onSuccess: (id) => navigate({ to: "/mesajlar", search: { c: id } }),
    onError: (e: Error) => toast.error(e.message),
  });

  if (!user || state === "self") return null;

  const cls = full ? "w-full" : "";

  if (isLoading) {
    return (
      <GlassButton size="sm" className={cls} disabled>
        Yükleniyor
      </GlassButton>
    );
  }

  if (state === "connected") {
    return (
      <GlassButton
        size="sm"
        variant="primary"
        className={cls}
        loading={message.isPending}
        onClick={() => message.mutate()}
      >
        <MessageSquare className="size-4" /> Mesaj Gönder
      </GlassButton>
    );
  }

  if (state === "outgoing") {
    return (
      <GlassButton size="sm" className={cls} disabled>
        <Clock className="size-4" /> İstek Gönderildi
      </GlassButton>
    );
  }

  if (state === "incoming") {
    return (
      <GlassButton
        size="sm"
        variant="primary"
        className={cls}
        loading={accept.isPending}
        onClick={() => accept.mutate()}
      >
        <Check className="size-4" /> İsteği Kabul Et
      </GlassButton>
    );
  }

  return (
    <GlassButton
      size="sm"
      variant="primary"
      className={cls}
      loading={sendRequest.isPending}
      onClick={() => sendRequest.mutate()}
    >
      <UserPlus className="size-4" /> Bağlantı Kur
    </GlassButton>
  );
}
