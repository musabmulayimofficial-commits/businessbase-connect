import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { MapPin } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { Avatar } from "@/components/Avatar";
import { ConnectionButton } from "@/components/ConnectionButton";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/profil/$id")({
  head: () => ({
    meta: [
      { title: "Üye Profili — BusinessBase" },
      { name: "description", content: "BusinessBase üye profili: sektör, yetenekler ve ilgi alanları." },
      { property: "og:title", content: "Üye Profili — BusinessBase" },
      { property: "og:description", content: "BusinessBase üye profili." },
    ],
  }),
  component: ProfilePage,
});

function Tags({ title, items }: { title: string; items: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full border border-border bg-glass-2 px-3 py-1 text-xs text-muted-foreground"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: async (): Promise<Profile | null> => {
      const { data: row, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return row;
    },
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <GlassPanel className="mx-auto max-w-3xl p-10 text-center text-sm text-muted-foreground">
          Profil yükleniyor...
        </GlassPanel>
      </PublicLayout>
    );
  }

  if (!data) {
    return (
      <PublicLayout>
        <GlassPanel className="mx-auto max-w-3xl p-10 text-center">
          <h1 className="text-xl font-semibold">Profil bulunamadı</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu profil kaldırılmış olabilir ya da görüntülemek için giriş yapman gerekiyor.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/network">
              <GlassButton>Network&apos;e dön</GlassButton>
            </Link>
            {!user ? (
              <Link to="/giris-yap">
                <GlassButton variant="primary">Giriş yap</GlassButton>
              </Link>
            ) : null}
          </div>
        </GlassPanel>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl space-y-4">
        <GlassPanel level={2} className="animate-fade-up p-7 sm:p-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <Avatar path={data.avatar_url} name={data.full_name || "Üye"} size="xl" />
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold sm:text-3xl">{data.full_name || "İsimsiz üye"}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {data.role || "Girişimci"}
                {data.sector ? ` · ${data.sector}` : ""}
              </p>
              {data.city ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden /> {data.city}
                </p>
              ) : null}
              {data.entrepreneurship_status ? (
                <span className="mt-3 inline-block rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs">
                  {data.entrepreneurship_status}
                </span>
              ) : null}
            </div>
            <div className="sm:self-start">
              <ConnectionButton targetId={data.id} />
            </div>
          </div>
        </GlassPanel>

        <GlassPanel className="p-7 sm:p-9">
          <h2 className="text-sm font-semibold">Hakkında</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {data.bio || "Bu üye henüz bir biyografi eklememiş."}
          </p>
        </GlassPanel>

        {(data.skills?.length ?? 0) > 0 || (data.interests?.length ?? 0) > 0 ? (
          <GlassPanel className="space-y-6 p-7 sm:p-9">
            <Tags title="Yetenekler" items={data.skills ?? []} />
            <Tags title="İlgi alanları" items={data.interests ?? []} />
          </GlassPanel>
        ) : null}
      </div>
    </PublicLayout>
  );
}
