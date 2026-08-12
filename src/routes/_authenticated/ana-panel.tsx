import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { AppShell, EmptyState } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { OpportunityCard } from "@/components/cards";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { Modal } from "@/components/ui/modal";
import { FormField, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { OPPORTUNITY_CATEGORIES, formatDate } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyProfile } from "@/lib/hooks";
import type { EventRow, Opportunity, Profile } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/ana-panel")({
  head: () => ({
    meta: [
      { title: "Ana Panel — BusinessBase" },
      { name: "description", content: "Bağlantı istekleri, fırsatların ve yaklaşan etkinliklerin." },
      { property: "og:title", content: "Ana Panel — BusinessBase" },
      { property: "og:description", content: "BusinessBase çalışma alanın." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: requests } = useQuery({
    queryKey: ["connection-requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("connection_requests")
        .select("id, sender_id, created_at, sender:profiles!connection_requests_sender_id_fkey(id, full_name, role, avatar_url)")
        .eq("receiver_id", user!.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as {
        id: string;
        sender_id: string;
        created_at: string;
        sender: Pick<Profile, "id" | "full_name" | "role" | "avatar_url"> | null;
      }[];
    },
  });

  const { data: connectionsCount } = useQuery({
    queryKey: ["connections-count", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("connections")
        .select("id", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const { data: myOpportunities } = useQuery({
    queryKey: ["my-opportunities", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Opportunity[]> => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("*")
        .eq("created_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: events } = useQuery({
    queryKey: ["events-upcoming"],
    queryFn: async (): Promise<EventRow[]> => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const respond = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "accepted" | "rejected" }) => {
      const { error } = await supabase
        .from("connection_requests")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
      return status;
    },
    onSuccess: (status) => {
      toast.success(status === "accepted" ? "Bağlantı kuruldu." : "İstek reddedildi.");
      queryClient.invalidateQueries({ queryKey: ["connection-requests", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["connections-count", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["connections", user?.id] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeOpportunity = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("opportunities").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("İlan kaldırıldı.");
      queryClient.invalidateQueries({ queryKey: ["my-opportunities", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["opportunities-public"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function createOpportunity(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const description = String(form.get("description") ?? "").trim();
    const category = String(form.get("category") ?? "");
    const location = String(form.get("location") ?? "").trim();
    if (title.length < 5 || description.length < 20 || !category) {
      toast.error("Başlık, kategori ve en az 20 karakterlik açıklama gerekli.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("opportunities")
      .insert({ title, description, category, location, created_by: user!.id });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Fırsat yayınlandı.");
    setModal(false);
    queryClient.invalidateQueries({ queryKey: ["my-opportunities", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["opportunities-public"] });
  }

  return (
    <AppShell
      title={`Merhaba, ${profile?.full_name?.split(" ")[0] ?? "girişimci"}`}
      description="Network'ünde bugün olan biten."
      actions={
        <GlassButton variant="primary" onClick={() => setModal(true)}>
          <Plus className="size-4" /> Fırsat Paylaş
        </GlassButton>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <GlassPanel className="p-6">
          <p className="text-3xl font-extrabold">{connectionsCount ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">Bağlantı</p>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="text-3xl font-extrabold">{requests?.length ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">Bekleyen istek</p>
        </GlassPanel>
        <GlassPanel className="p-6">
          <p className="text-3xl font-extrabold">{myOpportunities?.length ?? 0}</p>
          <p className="mt-1 text-sm text-muted-foreground">Yayındaki ilanın</p>
        </GlassPanel>
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Bağlantı istekleri</h2>
        <div className="mt-4 space-y-3">
          {(requests ?? []).map((r) => (
            <GlassPanel key={r.id} className="flex flex-wrap items-center gap-4 p-4">
              <Avatar path={r.sender?.avatar_url} name={r.sender?.full_name || "Üye"} size="sm" />
              <div className="min-w-0 flex-1">
                <Link
                  to="/profil/$id"
                  params={{ id: r.sender_id }}
                  className="truncate text-sm font-medium hover:underline"
                >
                  {r.sender?.full_name || "Üye"}
                </Link>
                <p className="truncate text-xs text-muted-foreground">{r.sender?.role}</p>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  size="sm"
                  variant="primary"
                  loading={respond.isPending}
                  onClick={() => respond.mutate({ id: r.id, status: "accepted" })}
                >
                  Kabul Et
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="ghost"
                  onClick={() => respond.mutate({ id: r.id, status: "rejected" })}
                >
                  Reddet
                </GlassButton>
              </div>
            </GlassPanel>
          ))}
          {(requests?.length ?? 0) === 0 ? (
            <EmptyState
              title="Bekleyen istek yok"
              description="Yeni bağlantı istekleri geldiğinde burada görünecek."
              action={
                <Link to="/network">
                  <GlassButton>Network&apos;ü keşfet</GlassButton>
                </Link>
              }
            />
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Fırsatların</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {(myOpportunities ?? []).map((o) => (
            <OpportunityCard
              key={o.id}
              opportunity={o}
              actions={
                <GlassButton
                  size="sm"
                  variant="danger"
                  onClick={() => removeOpportunity.mutate(o.id)}
                >
                  Kaldır
                </GlassButton>
              }
            />
          ))}
        </div>
        {(myOpportunities?.length ?? 0) === 0 ? (
          <EmptyState
            title="Henüz ilan yayınlamadın"
            description="Ortak, yatırım ya da ekip arkadaşı arıyorsan networke duyur."
            action={
              <GlassButton variant="primary" onClick={() => setModal(true)}>
                Fırsat paylaş
              </GlassButton>
            }
          />
        ) : null}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Yaklaşan etkinlikler</h2>
        <div className="mt-4 space-y-3">
          {(events ?? []).map((e) => (
            <GlassPanel key={e.id} className="flex flex-wrap items-center gap-4 p-5">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{e.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(e.event_date)} · {e.event_time.slice(0, 5)} · {e.location}
                </p>
              </div>
              <Link to="/etkinlikler">
                <GlassButton size="sm">Detay</GlassButton>
              </Link>
            </GlassPanel>
          ))}
          {(events?.length ?? 0) === 0 ? (
            <EmptyState
              title="Planlanmış etkinlik yok"
              description="Yeni buluşmalar duyurulduğunda burada göreceksin."
            />
          ) : null}
        </div>
      </section>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Fırsat paylaş"
        description="Networkün ne aradığını bilsin."
      >
        <form onSubmit={createOpportunity} className="space-y-4" noValidate>
          <FormField label="Başlık" htmlFor="title">
            <TextInput id="title" name="title" maxLength={120} placeholder="Ör. Teknik ortak arıyorum" />
          </FormField>
          <FormField label="Kategori" htmlFor="category">
            <SelectInput id="category" name="category" defaultValue="">
              <option value="" disabled>
                Seç
              </option>
              {OPPORTUNITY_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </SelectInput>
          </FormField>
          <FormField label="Konum" htmlFor="location" hint="Opsiyonel">
            <TextInput id="location" name="location" maxLength={80} placeholder="İstanbul / Uzaktan" />
          </FormField>
          <FormField label="Açıklama" htmlFor="description">
            <TextArea id="description" name="description" maxLength={2000} />
          </FormField>
          <GlassButton type="submit" variant="primary" className="w-full" loading={saving}>
            Yayınla
          </GlassButton>
        </form>
      </Modal>
    </AppShell>
  );
}
