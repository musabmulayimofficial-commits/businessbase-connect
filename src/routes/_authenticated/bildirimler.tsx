import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell, EmptyState } from "@/components/AppShell";
import { NotificationItem } from "@/components/cards";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { NotificationRow } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/bildirimler")({
  head: () => ({
    meta: [
      { title: "Bildirimler — BusinessBase" },
      { name: "description", content: "Bağlantı, mesaj ve etkinlik bildirimlerin." },
      { property: "og:title", content: "Bildirimler — BusinessBase" },
      { property: "og:description", content: "Tüm bildirimlerin tek yerde." },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<NotificationRow[]> => {
      const { data: rows, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return rows ?? [];
    },
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread", user?.id] });
  };

  const markOne = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return (
    <AppShell
      title="Bildirimler"
      description="Network'ünde seni ilgilendiren her şey."
      actions={
        <GlassButton onClick={() => markAll.mutate()} loading={markAll.isPending}>
          Tümünü okundu işaretle
        </GlassButton>
      }
    >
      <GlassPanel level={2} className="space-y-2 p-4">
        {(data ?? []).map((n) => (
          <NotificationItem key={n.id} notification={n} onRead={(id) => markOne.mutate(id)} />
        ))}
        {!isLoading && (data?.length ?? 0) === 0 ? (
          <EmptyState
            title="Bildirim yok"
            description="Yeni bağlantı istekleri, mesajlar ve etkinlikler burada görünecek."
          />
        ) : null}
      </GlassPanel>
    </AppShell>
  );
}
