import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { MemberCard } from "@/components/cards";
import { GlassPanel } from "@/components/ui/glass";
import { SelectInput, TextInput } from "@/components/ui/form-field";
import { CITIES, ENTREPRENEURSHIP_STATUSES, SECTORS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/lib/types";

export const Route = createFileRoute("/network")({
  head: () => ({
    meta: [
      { title: "Network — BusinessBase Üyeleri" },
      {
        name: "description",
        content:
          "BusinessBase üyelerini sektöre, şehre ve girişimcilik durumuna göre filtreleyerek keşfet.",
      },
      { property: "og:title", content: "Network — BusinessBase Üyeleri" },
      { property: "og:description", content: "Girişimcileri keşfet, doğru kişiyi bul." },
    ],
  }),
  component: NetworkPage,
});

function NetworkPage() {
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["profiles-directory"],
    queryFn: async (): Promise<Profile[]> => {
      const { data: rows, error: err } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (err) throw err;
      return rows ?? [];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return (data ?? []).filter((p) => {
      if (sector && p.sector !== sector) return false;
      if (city && p.city !== city) return false;
      if (status && p.entrepreneurship_status !== status) return false;
      if (!q) return true;
      return [p.full_name, p.role, p.bio, p.sector, ...(p.skills ?? [])]
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(q);
    });
  }, [data, search, sector, city, status]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl">
        <header className="animate-fade-up">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Network</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Girişimcileri keşfet. Sektöre, şehre ve girişimcilik durumuna göre filtrele.
          </p>
        </header>

        <GlassPanel level={2} className="animate-fade-up mt-8 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <TextInput
              aria-label="Üye ara"
              placeholder="İsim, rol veya yetenek ara"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <SelectInput aria-label="Sektör" value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">Tüm sektörler</option>
            {SECTORS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
          <SelectInput aria-label="Şehir" value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">Tüm şehirler</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
          <SelectInput
            aria-label="Girişimcilik durumu"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Tüm durumlar</option>
            {ENTREPRENEURSHIP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectInput>
        </GlassPanel>

        <p className="mt-6 text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `${filtered.length} üye`}
        </p>

        {error ? (
          <GlassPanel className="mt-6 p-8 text-center text-sm text-muted-foreground">
            Üyeleri görmek için giriş yapman gerekiyor.
          </GlassPanel>
        ) : null}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <MemberCard key={p.id} profile={p} />
          ))}
        </div>

        {!isLoading && !error && filtered.length === 0 ? (
          <GlassPanel className="mt-6 p-10 text-center text-sm text-muted-foreground">
            Bu filtrelere uyan üye bulunamadı.
          </GlassPanel>
        ) : null}
      </div>
    </PublicLayout>
  );
}
