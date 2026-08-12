import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassPanel } from "@/components/ui/glass";

export const Route = createFileRoute("/topluluk-kurallari")({
  head: () => ({
    meta: [
      { title: "Topluluk Kuralları — BusinessBase" },
      {
        name: "description",
        content: "BusinessBase üyelerinin uyması beklenen topluluk kuralları ve davranış ilkeleri.",
      },
      { property: "og:title", content: "Topluluk Kuralları — BusinessBase" },
      { property: "og:description", content: "Networkü güvenli tutan davranış ilkelerimiz." },
    ],
  }),
  component: Rules,
});

const RULES = [
  {
    title: "1. Gerçek kimliğinle ol",
    text: "Profilindeki isim, unvan ve iş bilgileri doğru olmalı. Sahte kimlik tespit edilen hesaplar kapatılır.",
  },
  {
    title: "2. Spam ve toplu satış yok",
    text: "Networkü bir e-posta listesi gibi kullanma. Tanışmadan doğrudan satış mesajı gönderme.",
  },
  {
    title: "3. Önce ver",
    text: "Bir talepte bulunmadan önce networke ne katabileceğini düşün. Karşılık beklemeden yardım et.",
  },
  {
    title: "4. Mahremiyete saygı",
    text: "Özel mesajlarda paylaşılan bilgileri izinsiz üçüncü kişilerle paylaşma, ekran görüntüsü dağıtma.",
  },
  {
    title: "5. Saygılı iletişim",
    text: "Hakaret, taciz, ayrımcılık ve nefret söylemi kesinlikle yasaktır ve doğrudan hesap kapatma sebebidir.",
  },
  {
    title: "6. Doğru bilgi paylaş",
    text: "Fırsat ilanlarında gerçek olmayan getiri vaatleri, yanıltıcı finansal iddialar paylaşma.",
  },
  {
    title: "7. Etkinliklerde söz ver, sözünü tut",
    text: "Katılacağını söylediğin etkinliğe gel; gelemeyeceksen katılımını önceden geri çek.",
  },
];

function Rules() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="animate-fade-up text-4xl font-extrabold sm:text-5xl">Topluluk Kuralları</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          BusinessBase&apos;in değeri üyelerinin kalitesinden gelir. Bu kurallar networkü güvenli ve
          verimli tutmak için var; üye olduğunda bunları kabul etmiş sayılırsın.
        </p>
        <div className="mt-10 space-y-4">
          {RULES.map((r) => (
            <GlassPanel key={r.title} className="p-6">
              <h2 className="text-lg font-semibold">{r.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.text}</p>
            </GlassPanel>
          ))}
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Kurallara aykırı bir durumla karşılaşırsan ayarlar sayfasındaki destek adresinden bize
          bildir. Her bildirim incelenir.
        </p>
      </div>
    </PublicLayout>
  );
}
