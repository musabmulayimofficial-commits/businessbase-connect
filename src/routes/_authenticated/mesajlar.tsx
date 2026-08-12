import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { MessagePreview } from "@/components/cards";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { TextInput } from "@/components/ui/form-field";
import { formatDateTime } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { MessageRow, Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/mesajlar")({
  validateSearch: (search: Record<string, unknown>) => ({
    c: typeof search["c"] === "string" ? (search["c"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Mesajlar — BusinessBase" },
      { name: "description", content: "Bağlantılarınla özel mesajlaş." },
      { property: "og:title", content: "Mesajlar — BusinessBase" },
      { property: "og:description", content: "Bağlantılarınla özel mesajlaş." },
    ],
  }),
  component: Messages,
});

type ConversationItem = {
  id: string;
  last_message_at: string;
  other: Profile | null;
  lastMessage: string;
  unread: number;
};

function Messages() {
  const { user } = useAuth();
  const { c } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { data: conversations } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ConversationItem[]> => {
      const { data: convs, error } = await supabase
        .from("conversations")
        .select("id, user_a, user_b, last_message_at")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const list = convs ?? [];
      if (list.length === 0) return [];
      const otherIds = list.map((cv) => (cv.user_a === user!.id ? cv.user_b : cv.user_a));
      const { data: profiles } = await supabase.from("profiles").select("*").in("id", otherIds);
      const { data: msgs } = await supabase
        .from("messages")
        .select("conversation_id, content, sender_id, read_at, created_at")
        .in(
          "conversation_id",
          list.map((cv) => cv.id),
        )
        .order("created_at", { ascending: false });
      return list.map((cv) => {
        const otherId = cv.user_a === user!.id ? cv.user_b : cv.user_a;
        const convMsgs = (msgs ?? []).filter((m) => m.conversation_id === cv.id);
        return {
          id: cv.id,
          last_message_at: cv.last_message_at,
          other: (profiles ?? []).find((p) => p.id === otherId) ?? null,
          lastMessage: convMsgs[0]?.content ?? "Henüz mesaj yok",
          unread: convMsgs.filter((m) => m.sender_id !== user!.id && !m.read_at).length,
        };
      });
    },
  });

  const activeId = c ?? conversations?.[0]?.id;
  const active = useMemo(
    () => (conversations ?? []).find((cv) => cv.id === activeId) ?? null,
    [conversations, activeId],
  );

  const { data: messages } = useQuery({
    queryKey: ["messages", activeId],
    enabled: !!activeId,
    queryFn: async (): Promise<MessageRow[]> => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", activeId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeId || !user) return;
    void supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("conversation_id", activeId)
      .neq("sender_id", user.id)
      .is("read_at", null)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["conversations", user.id] });
        queryClient.invalidateQueries({ queryKey: ["messages-unread", user.id] });
      });
  }, [activeId, user, queryClient, messages?.length]);

  useEffect(() => {
    if (!activeId) return;
    const channel = supabase
      .channel(`messages-${activeId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${activeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
          queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeId, queryClient, user?.id]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const content = text.trim();
    if (!content || !activeId) return;
    setSending(true);
    const { error } = await supabase
      .from("messages")
      .insert({ conversation_id: activeId, sender_id: user!.id, content });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setText("");
    queryClient.invalidateQueries({ queryKey: ["messages", activeId] });
    queryClient.invalidateQueries({ queryKey: ["conversations", user?.id] });
  }

  return (
    <AppShell title="Mesajlar" description="Bağlantılarınla birebir konuş.">
      {(conversations?.length ?? 0) === 0 ? (
        <EmptyState
          title="Henüz mesajın yok"
          description="Bağlantı kurduğun kişilerin profilinden mesaj göndererek başlayabilirsin."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <GlassPanel level={2} className="max-h-[70vh] space-y-1 overflow-y-auto p-3">
            {(conversations ?? []).map((cv) => (
              <MessagePreview
                key={cv.id}
                name={cv.other?.full_name || "Üye"}
                avatar={cv.other?.avatar_url}
                lastMessage={cv.lastMessage}
                time={cv.last_message_at}
                unread={cv.unread}
                active={cv.id === activeId}
                onClick={() => navigate({ to: "/mesajlar", search: { c: cv.id } })}
              />
            ))}
          </GlassPanel>

          <GlassPanel level={2} className="flex h-[70vh] flex-col p-0">
            <div className="flex items-center gap-3 border-b border-border p-4">
              <Avatar path={active?.other?.avatar_url} name={active?.other?.full_name || "Üye"} size="sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{active?.other?.full_name || "Üye"}</p>
                <p className="truncate text-xs text-muted-foreground">{active?.other?.role}</p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {(messages ?? []).map((m) => {
                const mine = m.sender_id === user?.id;
                return (
                  <div key={m.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                        mine
                          ? "bg-primary text-primary-foreground"
                          : "bg-glass-3 text-foreground"
                      }`}
                    >
                      <p className="whitespace-pre-line break-words">{m.content}</p>
                      <p className="mt-1 text-[10px] opacity-70">{formatDateTime(m.created_at)}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            <form onSubmit={send} className="flex gap-2 border-t border-border p-3">
              <TextInput
                aria-label="Mesaj yaz"
                placeholder="Mesajını yaz..."
                maxLength={2000}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
              <GlassButton type="submit" variant="primary" loading={sending} aria-label="Gönder">
                <Send className="size-4" />
              </GlassButton>
            </form>
          </GlassPanel>
        </div>
      )}
    </AppShell>
  );
}
