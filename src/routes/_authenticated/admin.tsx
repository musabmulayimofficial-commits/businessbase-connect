import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/integrations/supabase/client";
import { adminDecideApplication } from "@/lib/applications.functions";
import { useIsAdmin } from "@/lib/hooks";
import { formatDateTime } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Application = Database["public"]["Tables"]["applications"]["Row"];

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Yönetici Paneli — BusinessBase" },
      { name: "description", content: "BusinessBase başvuru, üye ve içerik yönetimi paneli." },
      { property: "og:title", content: "Yönetici Paneli — BusinessBase" },
      { property: "og:description", content: "Başvuruları incele, onayla veya reddet." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const TABS = [
  { key: "applications", label: "Başvurular" },
  { key: "members", label: "Üyeler" },
  { key: "opportunities", label: "Fırsatlar" },
  { key: "events", label: "Etkinlikler" },
  { key: "notifications", label: "Bildirimler" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "pending", label: "Bekleyen" },
  { key: "ai_approved", label: "AI Onayladı" },
  { key: "manual_review", label: "Manuel İnceleme" },
  { key: "approved", label: "Onaylanan" },
  { key: "rejected", label: "Reddedilen" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

const STATUS_LABEL: Record<string, string> = {
  pending: "Bekliyor",
  approved: "Onaylandı",
  rejected: "Reddedildi",
  manual_review: "Manuel inceleme",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        status === "approved" && "border-primary/40 bg-primary/15 text-primary",
        status === "rejected" && "border-destructive/40 bg-destructive/15 text-destructive",
        status === "manual_review" && "border-border bg-glass-2 text-foreground",
        status === "pending" && "border-border bg-glass-1 text-muted-foreground",
      )}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function AdminPage() {
  const { data: isAdmin, isLoading } = useIsAdmin();
  const [tab, setTab] = useState<TabKey>("applications");

  if (isLoading) {
    return (
      <AppShell title="Yönetici Paneli">
        <GlassPanel className="p-8 text-sm text-muted-foreground">Yetki kontrol ediliyor…</GlassPanel>
      </AppShell>
    );
  }

  if (!isAdmin) {
    return (
      <AppShell title="Yönetici Paneli">
        <GlassPanel className="flex flex-col items-start gap-4 p-8">
          <ShieldAlert className="size-6 text-destructive" aria-hidden />
          <div>
            <h2 className="text-lg font-semibold">Bu alana erişimin yok</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Yönetici paneli yalnızca doğrulanmış yönetici hesabına açıktır.
            </p>
          </div>
          <Link to="/ana-panel">
            <GlassButton variant="glass">Ana panele dön</GlassButton>
          </Link>
        </GlassPanel>
      </AppShell>
    );
  }

  return (
    <AppShell title="Yönetici Paneli" description="Başvuruları ve topluluk içeriğini yönet.">
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <GlassButton
            key={t.key}
            size="sm"
            variant={tab === t.key ? "primary" : "glass"}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </GlassButton>
        ))}
      </div>
      {tab === "applications" ? <ApplicationsTab /> : null}
      {tab === "members" ? <MembersTab /> : null}
      {tab === "opportunities" ? <OpportunitiesTab /> : null}
      {tab === "events" ? <EventsTab /> : null}
      {tab === "notifications" ? <NotificationsTab /> : null}
    </AppShell>
  );
}

function ApplicationsTab() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selected, setSelected] = useState<Application | null>(null);
  const decide = useServerFn(adminDecideApplication);

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ["admin-applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
  });

  const mutation = useMutation({
    mutationFn: (input: { id: number; decision: "approved" | "rejected" }) =>
      decide({ data: input }),
    onSuccess: (_, input) => {
      toast.success(input.decision === "approved" ? "Başvuru onaylandı" : "Başvuru reddedildi");
      setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-applications"] });
    },
    onError: () => toast.error("İşlem tamamlanamadı"),
  });

  const filtered = useMemo(() => {
    return applications.filter((a) => {
      if (filter === "all") return true;
      if (filter === "ai_approved") return a.ai_decision === "approve";
      return a.status === filter;
    });
  }, [applications, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs transition-colors",
              filter === f.key
                ? "border-primary/50 bg-primary/15 text-foreground"
                : "border-border bg-glass-1 text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <GlassPanel className="p-6 text-sm text-muted-foreground">Yükleniyor…</GlassPanel>
      ) : filtered.length === 0 ? (
        <GlassPanel className="p-6 text-sm text-muted-foreground">
          Bu filtreye uyan başvuru yok.
        </GlassPanel>
      ) : (
        <div className="grid gap-4">
          {filtered.map((app) => (
            <GlassPanel key={app.id} hover className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold">{app.full_name}</h3>
                    <StatusBadge status={app.status} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {app.email} · {app.city} · {app.profession}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {app.entrepreneurship_status} · {formatDateTime(app.created_at)}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="text-lg font-semibold text-foreground">{app.ai_score ?? "—"}</div>
                  AI puanı
                </div>
              </div>
              {app.ai_reason ? (
                <p className="mt-3 rounded-lg bg-glass-1 p-3 text-xs text-muted-foreground">
                  <strong className="text-foreground">AI kararı:</strong> {app.ai_decision ?? "—"} —{" "}
                  {app.ai_reason}
                </p>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2">
                <GlassButton size="sm" variant="glass" onClick={() => setSelected(app)}>
                  Başvuruyu Gör
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="primary"
                  loading={mutation.isPending}
                  disabled={app.status === "approved"}
                  onClick={() => mutation.mutate({ id: app.id, decision: "approved" })}
                >
                  Onayla
                </GlassButton>
                <GlassButton
                  size="sm"
                  variant="danger"
                  loading={mutation.isPending}
                  disabled={app.status === "rejected"}
                  onClick={() => mutation.mutate({ id: app.id, decision: "rejected" })}
                >
                  Reddet
                </GlassButton>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.full_name ?? ""}
        description="Başvuru detayı"
      >
        {selected ? <ApplicationDetail app={selected} /> : null}
      </Modal>
    </div>
  );
}

function ApplicationDetail({ app }: { app: Application }) {
  const { data: events = [] } = useQuery({
    queryKey: ["admin-application-events", app.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("application_events")
        .select("*")
        .eq("application_id", app.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const rows: Array<[string, string]> = [
    ["E-posta", app.email],
    ["Telefon", app.phone],
    ["Şehir", app.city],
    ["Meslek", app.profession],
    ["Girişimcilik durumu", app.entrepreneurship_status],
    ["Durum", STATUS_LABEL[app.status] ?? app.status],
    ["AI puanı", app.ai_score != null ? String(app.ai_score) : "—"],
    ["AI kararı", app.ai_decision ?? "—"],
    ["AI açıklaması", app.ai_reason ?? "—"],
    ["Başvuru tarihi", formatDateTime(app.created_at)],
    ["İnceleme tarihi", app.reviewed_at ? formatDateTime(app.reviewed_at) : "—"],
  ];

  return (
    <div className="space-y-4 text-sm">
      <dl className="grid gap-2">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[130px_1fr] gap-3">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <div>
        <p className="mb-1 text-muted-foreground">Başvuru nedeni</p>
        <p className="rounded-lg bg-glass-1 p-3 leading-relaxed">{app.reason}</p>
      </div>
      <div>
        <p className="mb-1 text-muted-foreground">Karar geçmişi</p>
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="rounded-lg bg-glass-1 p-3 text-xs">
              <span className="font-medium text-foreground">{e.actor}</span> · {e.decision}
              {e.score != null ? ` · ${e.score}` : ""} · {formatDateTime(e.created_at)}
              {e.reason ? <p className="mt-1 text-muted-foreground">{e.reason}</p> : null}
            </li>
          ))}
          {events.length === 0 ? <li className="text-xs text-muted-foreground">Kayıt yok.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function SimpleList({
  queryKey,
  load,
  empty,
}: {
  queryKey: string;
  load: () => Promise<Array<{ id: string; title: string; subtitle: string }>>;
  empty: string;
}) {
  const { data = [], isLoading } = useQuery({ queryKey: [queryKey], queryFn: load });
  if (isLoading)
    return <GlassPanel className="p-6 text-sm text-muted-foreground">Yükleniyor…</GlassPanel>;
  if (data.length === 0)
    return <GlassPanel className="p-6 text-sm text-muted-foreground">{empty}</GlassPanel>;
  return (
    <div className="grid gap-3">
      {data.map((item) => (
        <GlassPanel key={item.id} className="p-4">
          <p className="text-sm font-medium text-foreground">{item.title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.subtitle}</p>
        </GlassPanel>
      ))}
    </div>
  );
}

function MembersTab() {
  return (
    <SimpleList
      queryKey="admin-members"
      empty="Henüz üye yok."
      load={async () => {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, city, sector, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data.map((p) => ({
          id: p.id,
          title: p.full_name || "İsimsiz üye",
          subtitle: [p.sector, p.city, formatDateTime(p.created_at)].filter(Boolean).join(" · "),
        }));
      }}
    />
  );
}

function OpportunitiesTab() {
  return (
    <SimpleList
      queryKey="admin-opportunities"
      empty="Henüz fırsat yok."
      load={async () => {
        const { data, error } = await supabase
          .from("opportunities")
          .select("id, title, category, location, created_at")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data.map((o) => ({
          id: o.id,
          title: o.title,
          subtitle: [o.category, o.location, formatDateTime(o.created_at)].filter(Boolean).join(" · "),
        }));
      }}
    />
  );
}

function EventsTab() {
  return (
    <SimpleList
      queryKey="admin-events"
      empty="Henüz etkinlik yok."
      load={async () => {
        const { data, error } = await supabase
          .from("events")
          .select("id, name, location, event_date, organizer_name")
          .order("event_date", { ascending: false });
        if (error) throw error;
        return data.map((e) => ({
          id: e.id,
          title: e.name,
          subtitle: [e.organizer_name, e.location, e.event_date].filter(Boolean).join(" · "),
        }));
      }}
    />
  );
}

function NotificationsTab() {
  return (
    <SimpleList
      queryKey="admin-notifications"
      empty="Bildirim yok."
      load={async () => {
        const { data, error } = await supabase
          .from("notifications")
          .select("id, title, body, created_at")
          .order("created_at", { ascending: false })
          .limit(50);
        if (error) throw error;
        return data.map((n) => ({
          id: n.id,
          title: n.title,
          subtitle: [n.body, formatDateTime(n.created_at)].filter(Boolean).join(" · "),
        }));
      }}
    />
  );
}
