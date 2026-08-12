import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { EventCard } from "@/components/cards";
import { GlassPanel } from "@/components/ui/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { EventRow } from "@/lib/types";

export const Route = createFileRoute("/etkinlikler")({
  head: () => ({
    meta: [
      { title: "Etkinlikler — BusinessBase" },
      {
        name: "description",
        content: "BusinessBase buluşmaları ve etkinlikleri. Katıl, yüz yüze tanış, networkünü büyüt.",
      },
      { property: "og:title", content: "Etkinlikler — BusinessBase" },
      { property: "og:description", content: "Girişimci buluşmalarına katıl." },
    ],
  }),
  component: Events,
});

function Events() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async (): Promise<EventRow[]> => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: participants } = useQuery({
    queryKey: ["event-participants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("event_participants").select("event_id, user_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ eventId, joined }: { eventId: string; joined: boolean }) => {
      if (joined) {
        const { error } = await supabase
          .from("event_participants")
          .delete()
          .eq("event_id", eventId)
          .eq("user_id", user!.id);
        if (error) throw error;
        return false;
      }
      const { error } = await supabase
        .from("event_participants")
        .insert({ event_id: eventId, user_id: user!.id });
      if (error) throw error;
      return true;
    },
    onSuccess: (joined) => {
      toast.success(joined ? "Etkinliğe katıldın." : "Katılımın geri alındı.");
      queryClient.invalidateQueries({ queryKey: ["event-participants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const today = new Date().toISOString().slice(0, 10);
  const upcoming = (events ?? []).filter((e) => e.event_date >= today);
  const past = (events ?? []).filter((e) => e.event_date < today).reverse();

  const countFor = (id: string) => (participants ?? []).filter((p) => p.event_id === id).length;
  const joinedFor = (id: string) =>
    !!user && (participants ?? []).some((p) => p.event_id === id && p.user_id === user.id);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl">
        <header className="animate-fade-up">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Etkinlikler</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Küçük gruplarla yapılan gerçek buluşmalar. Katılımını bildir, yerini ayırt.
          </p>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Yaklaşan etkinlikler</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                participantCount={countFor(e.id)}
                joined={joinedFor(e.id)}
                pending={toggle.isPending}
                canJoin={!!user}
                onToggle={() => toggle.mutate({ eventId: e.id, joined: joinedFor(e.id) })}
              />
            ))}
          </div>
          {!isLoading && upcoming.length === 0 ? (
            <GlassPanel className="mt-5 p-10 text-center text-sm text-muted-foreground">
              Şu anda planlanmış bir etkinlik yok. Yeni buluşmalar burada duyurulacak.
            </GlassPanel>
          ) : null}
        </section>

        {past.length > 0 ? (
          <section className="mt-14">
            <h2 className="text-xl font-semibold">Geçmiş etkinlikler</h2>
            <div className="mt-5 grid gap-4 opacity-70 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  participantCount={countFor(e.id)}
                  joined={joinedFor(e.id)}
                  pending={false}
                  canJoin={false}
                  onToggle={() => undefined}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PublicLayout>
  );
}
