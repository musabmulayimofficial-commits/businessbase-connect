import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Handshake, Lightbulb, Compass, Users } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BusinessBase — Girişimcilerin birbirini bulduğu network" },
      {
        name: "description",
        content:
          "Fikirlerini paylaş, doğru insanlarla tanış, iş ortaklıkları kur. BusinessBase girişimci networküne katıl.",
      },
      { property: "og:title", content: "BusinessBase — Girişimci Networkü" },
      {
        property: "og:description",
        content: "Fikirlerini paylaş. Doğru insanlarla tanış. İş ortaklıkları kur.",
      },
    ],
  }),
  component: Home,
});

const STATS = [
  { value: "1.200+", label: "Girişimci" },
  { value: "380+", label: "Kurulan bağlantı" },
  { value: "45+", label: "Aylık fırsat" },
  { value: "12", label: "Yıllık etkinlik" },
];

const PILLARS = [
  {
    icon: Users,
    title: "Girişimcilerle Tanış",
    text: "Aynı yolda yürüyen, benzer sorunları çözen insanlarla aynı odada ol.",
  },
  {
    icon: Handshake,
    title: "İş Ortaklıkları Kur",
    text: "Doğru ortak, doğru zamanda bulunduğunda iş modeli baştan değişir.",
  },
  {
    icon: Lightbulb,
    title: "Fikirlerini Paylaş",
    text: "Fikrini anlat, geri bildirim al, körlüğünü networkün gözüyle gör.",
  },
  {
    icon: Compass,
    title: "Yeni Fırsatlar Keşfet",
    text: "Yatırım, ortaklık, ekip ve proje fırsatları tek bir akışta.",
  },
];

function Home() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl space-y-24">
        <section className="animate-fade-up pt-8 text-center sm:pt-16">
          <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground">
            BUSINESSBASE NETWORK
          </p>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] sm:text-6xl">
            Girişimcilerin birbirini bulduğu network.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Fikirlerini paylaş. Doğru insanlarla tanış. İş ortaklıkları kur. Girişimcilik dünyasında
            yeni fırsatlar keşfet.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/networke-katil" className="w-full sm:w-auto">
              <GlassButton variant="primary" size="lg" className="w-full sm:w-auto">
                Network&apos;e Katıl <ArrowRight className="size-4" />
              </GlassButton>
            </Link>
            <Link to="/network" className="w-full sm:w-auto">
              <GlassButton size="lg" className="w-full sm:w-auto">
                Network&apos;ü Keşfet
              </GlassButton>
            </Link>
          </div>

          <GlassPanel className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-border/40 sm:grid-cols-4">
            {STATS.map((s) => (
              <div key={s.label} className="bg-glass-1 px-6 py-8">
                <p className="text-3xl font-extrabold text-foreground sm:text-4xl">{s.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </GlassPanel>
        </section>

        <section>
          <h2 className="max-w-2xl text-3xl font-bold sm:text-4xl">
            Girişimcilik, doğru bağlantılarla büyür.
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {PILLARS.map((p) => (
              <GlassPanel key={p.title} hover className="p-7">
                <p.icon className="size-6 text-primary" aria-hidden />
                <h3 className="mt-5 text-lg font-semibold">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.text}</p>
              </GlassPanel>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <GlassPanel level={2} className="p-8 sm:p-10">
            <h2 className="text-2xl font-bold sm:text-3xl">Doğru insanı bul.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Sektöre, şehre ve girişimcilik durumuna göre filtrele. Profilleri incele, ilgi
              alanlarını gör, doğrudan bağlantı isteği gönder. Aramak yerine bulmaya başla.
            </p>
            <Link to="/network" className="mt-7 inline-block">
              <GlassButton>
                Network&apos;ü Keşfet <ArrowRight className="size-4" />
              </GlassButton>
            </Link>
          </GlassPanel>
          <GlassPanel level={2} className="p-8 sm:p-10">
            <h2 className="text-2xl font-bold sm:text-3xl">Network sadece tanışmak değildir.</h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Fırsatlar panosunda ortak, yatırımcı, ekip arkadaşı veya proje ara. Kendi ilanını
              yayınla; networkündeki doğru kişi seni bulsun.
            </p>
            <Link to="/firsatlar" className="mt-7 inline-block">
              <GlassButton>
                Fırsatları Gör <ArrowRight className="size-4" />
              </GlassButton>
            </Link>
          </GlassPanel>
        </section>

        <section>
          <GlassPanel level={2} className="p-8 sm:p-12">
            <p className="text-xs font-semibold tracking-[0.26em] text-muted-foreground">
              BUSINESSBASE EVENTS
            </p>
            <h2 className="mt-4 max-w-2xl text-2xl font-bold sm:text-3xl">
              Yılda 12 buluşma, sınırsız tanışma.
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Küçük gruplarla yapılan, gerçekten konuşulan buluşmalar. Panel değil, sohbet.
              Etkinliklere katıl, yüz yüze tanış, networkünü büyüt.
            </p>
            <Link to="/etkinlikler" className="mt-7 inline-block">
              <GlassButton variant="primary">Etkinlikleri Gör</GlassButton>
            </Link>
          </GlassPanel>
        </section>

        <section className="pb-8 text-center">
          <h2 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight sm:text-5xl">
            Doğru bağlantı, doğru zamanda her şeyi değiştirebilir.
          </h2>
          <Link to="/networke-katil" className="mt-9 inline-block">
            <GlassButton variant="primary" size="lg">
              Network&apos;e Katıl <ArrowRight className="size-4" />
            </GlassButton>
          </Link>
        </section>
      </div>
    </PublicLayout>
  );
}
