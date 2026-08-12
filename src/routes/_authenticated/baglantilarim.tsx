import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, EmptyState } from "@/components/AppShell";
import { MemberCard } from "@/components/cards";
import { GlassButton } from "@/components/ui/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/baglantilarim")({
  head: () => ({
    meta: [
      { title: "Bağlantılarım — BusinessBase" },
      { name: "description", content: "Network'ünde kurduğun bağlantıların listesi." },
      { property: "og:title", content: "Bağlantılarım — BusinessBase" },
      { property: "og:description", content: "Kurduğun bağlantılar." },
    ],
  }),
  component: MyConnections,
});

function MyConnections() {
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["connections", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Profile[]> => {
      const { data: rows, error } = await supabase.from("connections").select("user_a, user_b");
      if (error) throw error;
      const ids = (rows ?? []).map((r) => (r.user_a === user!.id ? r.user_b : r.user_a));
      if (ids.length === 0) return [];
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      if (profileError) throw profileError;
      return profiles ?? [];
    },
  });

  return (
    <AppShell
      title="Bağlantılarım"
      description={isLoading ? "Yükleniyor..." : `${data?.length ?? 0} kişiyle bağlantıdasın.`}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data ?? []).map((p) => (
          <MemberCard key={p.id} profile={p} />
        ))}
      </div>
      {!isLoading && (data?.length ?? 0) === 0 ? (
        <EmptyState
          title="Henüz bağlantın yok"
          description="Network'ü keşfet, ilgini çeken girişimcilere bağlantı isteği gönder."
          action={
            <Link to="/network">
              <GlassButton variant="primary">Network&apos;ü keşfet</GlassButton>
            </Link>
          }
        />
      ) : null}
    </AppShell>
  );
}
