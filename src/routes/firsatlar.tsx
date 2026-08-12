import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { PublicLayout } from "@/components/PublicLayout";
import { OpportunityCard } from "@/components/cards";
import { GlassPanel } from "@/components/ui/glass";
import { SelectInput, TextInput } from "@/components/ui/form-field";
import { OPPORTUNITY_CATEGORIES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import type { Opportunity, Profile } from "@/lib/types";

export const Route = createFileRoute("/firsatlar")({
  head: () => ({
    meta: [
      { title: "Fırsatlar — BusinessBase" },
      {
        name: "description",
        content:
          "Ortaklık, yatırım, ekip ve proje fırsatlarını keşfet. BusinessBase üyelerinin ilanları.",
      },
      { property: "og:title", content: "Fırsatlar — BusinessBase" },
      { property: "og:description", content: "Ortaklık, yatırım ve proje fırsatları." },
    ],
  }),
  component: Opportunities,
});

type Row = Opportunity & { author: Pick<Profile, "id" | "full_name" | "avatar_url"> | null };

function Opportunities() {
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["opportunities-public"],
    queryFn: async (): Promise<Row[]> => {
      const { data: rows, error } = await supabase
        .from("opportunities")
        .select("*, author:profiles!opportunities_created_by_fkey(id, full_name, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (rows ?? []) as unknown as Row[];
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("tr");
    return (data ?? []).filter((o) => {
      if (category && o.category !== category) return false;
      if (!q) return true;
      return `${o.title} ${o.description} ${o.location}`.toLocaleLowerCase("tr").includes(q);
    });
  }, [data, category, search]);

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl">
        <header className="animate-fade-up">
          <h1 className="text-4xl font-extrabold sm:text-5xl">Fırsatlar</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground">
            Üyelerin paylaştığı ortaklık, yatırım, ekip ve proje ilanları. Kendi ilanını yayınlamak
            için ana panelini kullan.
          </p>
        </header>

        <GlassPanel level={2} className="animate-fade-up mt-8 grid gap-3 p-4 sm:grid-cols-2">
          <TextInput
            aria-label="Fırsat ara"
            placeholder="Anahtar kelime ara"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <SelectInput
            aria-label="Kategori"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Tüm kategoriler</option>
            {OPPORTUNITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectInput>
        </GlassPanel>

        <p className="mt-6 text-sm text-muted-foreground">
          {isLoading ? "Yükleniyor..." : `${filtered.length} fırsat`}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((o) => (
            <OpportunityCard key={o.id} opportunity={o} author={o.author} />
          ))}
        </div>

        {!isLoading && filtered.length === 0 ? (
          <GlassPanel className="mt-6 p-10 text-center text-sm text-muted-foreground">
            Şu an bu filtrelere uyan bir fırsat yok.
          </GlassPanel>
        ) : null}
      </div>
    </PublicLayout>
  );
}
