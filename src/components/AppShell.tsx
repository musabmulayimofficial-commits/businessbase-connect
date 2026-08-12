import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Briefcase,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Settings,
  ShieldCheck,
  User,
  Users,
  X,
} from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useMyProfile, useUnreadNotifications } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/ana-panel", label: "Ana Panel", icon: LayoutDashboard },
  { to: "/network", label: "Network", icon: Users },
  { to: "/mesajlar", label: "Mesajlar", icon: MessageSquare },
  { to: "/baglantilarim", label: "Bağlantılarım", icon: User },
  { to: "/firsatlar", label: "Fırsatlar", icon: Briefcase },
  { to: "/etkinlikler", label: "Etkinlikler", icon: CalendarDays },
  { to: "/bildirimler", label: "Bildirimler", icon: Bell },
] as const;

export function AppShell({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: profile } = useMyProfile();
  const unread = useUnreadNotifications();
  const { data: isAdmin } = useIsAdmin();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/giris-yap", replace: true });
  }

  const nav = (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-glass-3 font-medium text-foreground"
                : "text-muted-foreground hover:bg-glass-2 hover:text-foreground",
            )}
          >
            <item.icon className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">{item.label}</span>
            {item.to === "/bildirimler" && unread > 0 ? (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
                {unread}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarBody = (
    <>
      <Link to="/ana-panel" className="block px-3 py-1" onClick={() => setOpen(false)}>
        <span className="text-lg font-extrabold tracking-tight">BusinessBase</span>
      </Link>
      <div className="mt-7 flex-1">{nav}</div>
      <div className="mt-6 space-y-1 border-t border-border pt-4">
        <Link
          to="/profilim"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-glass-2"
        >
          <Avatar path={profile?.avatar_url} name={profile?.full_name || "Üye"} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{profile?.full_name || "Profilim"}</p>
            <p className="truncate text-xs text-muted-foreground">Profili düzenle</p>
          </div>
        </Link>
        {isAdmin ? (
          <Link
            to="/admin"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-glass-2 hover:text-foreground"
          >
            <ShieldCheck className="size-4" aria-hidden /> Yönetici Paneli
          </Link>
        ) : null}
        <Link
          to="/ayarlar"
          onClick={() => setOpen(false)}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-glass-2 hover:text-foreground"
        >
          <Settings className="size-4" aria-hidden /> Ayarlar
        </Link>
        <button
          onClick={signOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-glass-2 hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden /> Çıkış Yap
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-[1500px] gap-6 px-4 py-6 lg:px-8">
        <GlassPanel
          as="aside"
          level={2}
          className="sticky top-6 hidden h-[calc(100vh-3rem)] w-64 shrink-0 flex-col p-4 lg:flex"
        >
          {sidebarBody}
        </GlassPanel>

        <main className="min-w-0 flex-1 pb-24 lg:pb-0">
          <GlassPanel
            level={2}
            className="mb-6 flex items-center gap-3 p-4 lg:hidden"
            as="header"
          >
            <button
              aria-label="Menüyü aç"
              onClick={() => setOpen(true)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-glass-2 hover:text-foreground"
            >
              <Menu className="size-5" />
            </button>
            <span className="flex-1 text-base font-extrabold tracking-tight">BusinessBase</span>
            <Link to="/bildirimler" aria-label="Bildirimler" className="relative rounded-lg p-2">
              <Bell className="size-5 text-muted-foreground" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
              ) : null}
            </Link>
          </GlassPanel>

          <div className="animate-fade-up mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
              {description ? (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
              ) : null}
            </div>
            {actions}
          </div>

          {children}
        </main>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Menüyü kapat"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <GlassPanel
            level={3}
            className="animate-fade-up absolute inset-y-0 left-0 flex w-72 flex-col rounded-none rounded-r-2xl p-4"
          >
            <button
              aria-label="Kapat"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            {sidebarBody}
          </GlassPanel>
        </div>
      ) : null}

      <GlassPanel
        level={3}
        as="nav"
        className="fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-2xl p-2 lg:hidden"
      >
        {NAV.slice(0, 5).map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-label={item.label}
              className={cn(
                "rounded-xl p-3 transition-colors",
                active ? "bg-glass-3 text-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-5" aria-hidden />
            </Link>
          );
        })}
      </GlassPanel>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <GlassPanel className="p-10 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </GlassPanel>
  );
}

export { GlassButton };
