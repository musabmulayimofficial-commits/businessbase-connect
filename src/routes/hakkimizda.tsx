import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";

export const Route = createFileRoute("/hakkimizda")({
  head: () => ({
    meta: [
      { title: "Hakkımızda — BusinessBase" },
      {
        name: "description",
        content:
          "BusinessBase, Türkiye'deki girişimcileri birbirine bağlayan özel bir network topluluğudur.",
      },
      { property: "og:title", content: "Hakkımızda — BusinessBase" },
      {
        property: "og:description",
        content: "Girişimcileri birbirine bağlayan özel network topluluğu.",
      },
    ],
  }),
  component: About,
});

const VALUES = [
  {
    title: "Gerçek insanlar",
    text: "Her üye başvuru sürecinden geçer. Sahte profil yok, spam yok, satış avcısı yok.",
  },
  {
    title: "Karşılıklılık",
    text: "Almadan önce vermek esastır. Yardım eden, yardım bulur.",
  },
  {
    title: "Şeffaflık",
    text: "Ne yaptığını, nerede takıldığını açıkça anlatan girişimciler daha hızlı ilerler.",
  },
  {
    title: "Kalite > kalabalık",
    text: "10.000 tanımadığın kişi yerine, 100 gerçekten tanıdığın kişi.",
  },
];

function About() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-4xl space-y-16">
        <header className="animate-fade-up">
          <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground">
            HAKKIMIZDA
          </p>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight sm:text-5xl">
            Girişimcilik yalnız yürünen bir yol olmak zorunda değil.
          </h1>
          <p className="mt-6 text-base leading-relaxed text-muted-foreground">
            BusinessBase, Türkiye&apos;de girişimciliğin en zor kısmının fikir bulmak değil, doğru
            insanları bulmak olduğuna inanan bir topluluk. Kimin neyi bildiğini bilmediğinde her şey
            yavaşlar. Biz bu bilgi boşluğunu kapatmak için varız.
          </p>
        </header>

        <GlassPanel level={2} className="animate-fade-up p-8 sm:p-10">
          <h2 className="text-2xl font-bold">Neden buradayız?</h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Bir girişimcinin ihtiyaç duyduğu şeylerin çoğu — teknik ortak, ilk müşteri, doğru
            yatırımcı, benzer krizden geçmiş biri — aslında bir tanıdığın tanıdığında bulunuyor. Bu
            zinciri görünür kılmak, aramayı bulmaya çeviriyor.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            BusinessBase üyeleri profillerinde ne yaptıklarını, hangi sektörde olduklarını ve neye
            ihtiyaç duyduklarını paylaşır. Fırsatlar panosunda ihtiyaçlarını duyurur, etkinliklerde
            yüz yüze tanışır, mesajlaşarak iş birliğini başlatır.
          </p>
        </GlassPanel>

        <section>
          <h2 className="text-2xl font-bold sm:text-3xl">Değerlerimiz</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {VALUES.map((v) => (
              <GlassPanel key={v.title} hover className="p-7">
                <h3 className="text-lg font-semibold">{v.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.text}</p>
              </GlassPanel>
            ))}
          </div>
        </section>

        <GlassPanel level={2} className="p-8 text-center sm:p-12">
          <h2 className="text-2xl font-bold sm:text-3xl">Sen de aramıza katıl.</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Başvurunu gönder, ekibimiz değerlendirsin. Onaylandığında hesabını oluşturup
            network&apos;ün tamamına erişebilirsin.
          </p>
          <Link to="/networke-katil" className="mt-8 inline-block">
            <GlassButton variant="primary" size="lg">
              Network&apos;e Katıl
            </GlassButton>
          </Link>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
