import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Ana Sayfa" },
  { to: "/network", label: "Network" },
  { to: "/firsatlar", label: "Fırsatlar" },
  { to: "/etkinlikler", label: "Etkinlikler" },
  { to: "/hakkimizda", label: "Hakkımızda" },
] as const;

export function PublicLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="fixed inset-x-0 top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-5">
        <GlassPanel
          as="nav"
          level={2}
          aria-label="Ana menü"
          className="mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-xl px-4 py-3 sm:px-6"
        >
          <Link to="/" className="text-sm font-extrabold tracking-[0.18em] text-foreground">
            BUSINESSBASE
          </Link>

          <ul className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-glass-2 hover:text-foreground"
                  activeProps={{ className: "text-foreground bg-glass-2" }}
                  activeOptions={{ exact: item.to === "/" }}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden items-center gap-2 lg:flex">
            {user ? (
              <Link to="/ana-panel">
                <GlassButton variant="primary" size="sm">
                  Ana Panel
                </GlassButton>
              </Link>
            ) : (
              <>
                <Link to="/giris-yap">
                  <GlassButton variant="ghost" size="sm">
                    Giriş Yap
                  </GlassButton>
                </Link>
                <Link to="/networke-katil">
                  <GlassButton variant="primary" size="sm">
                    Network&apos;e Katıl
                  </GlassButton>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={open}
            className="rounded-lg p-2 text-foreground transition-colors hover:bg-glass-2 lg:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </GlassPanel>

        {open ? (
          <GlassPanel
            level={3}
            className="animate-fade-up mx-auto mt-2 max-w-6xl rounded-xl p-3 lg:hidden"
          >
            <ul className="space-y-1">
              {NAV.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:bg-glass-2 hover:text-foreground"
                    activeProps={{ className: "text-foreground bg-glass-2" }}
                    activeOptions={{ exact: item.to === "/" }}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {user ? (
                <Link to="/ana-panel" className="col-span-2" onClick={() => setOpen(false)}>
                  <GlassButton variant="primary" className="w-full">
                    Ana Panel
                  </GlassButton>
                </Link>
              ) : (
                <>
                  <Link to="/giris-yap" onClick={() => setOpen(false)}>
                    <GlassButton className="w-full">Giriş Yap</GlassButton>
                  </Link>
                  <Link to="/networke-katil" onClick={() => setOpen(false)}>
                    <GlassButton variant="primary" className="w-full">
                      Katıl
                    </GlassButton>
                  </Link>
                </>
              )}
            </div>
          </GlassPanel>
        ) : null}
      </header>

      <main className="flex-1 px-4 pb-20 pt-28 sm:px-6 sm:pt-32">{children}</main>

      <footer className="px-4 pb-8 sm:px-6">
        <GlassPanel className="mx-auto max-w-6xl rounded-xl px-6 py-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <p className="text-sm font-extrabold tracking-[0.18em]">BUSINESSBASE</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Girişimcilerin birbirini bulduğu network.
              </p>
            </div>
            <nav aria-label="Alt menü" className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm">
              <Link to="/network" className="text-muted-foreground hover:text-foreground">
                Network
              </Link>
              <Link to="/firsatlar" className="text-muted-foreground hover:text-foreground">
                Fırsatlar
              </Link>
              <Link to="/etkinlikler" className="text-muted-foreground hover:text-foreground">
                Etkinlikler
              </Link>
              <Link to="/hakkimizda" className="text-muted-foreground hover:text-foreground">
                Hakkımızda
              </Link>
              <Link to="/topluluk-kurallari" className="text-muted-foreground hover:text-foreground">
                Topluluk Kuralları
              </Link>
              <Link
                to="/gizlilik-politikasi"
                className="text-muted-foreground hover:text-foreground"
              >
                Gizlilik Politikası
              </Link>
            </nav>
          </div>
          <p className="mt-8 border-t border-border pt-6 text-xs text-muted-foreground">
            © {new Date().getFullYear()} BusinessBase. Tüm hakları saklıdır.
          </p>
        </GlassPanel>
      </footer>
    </div>
  );
}
