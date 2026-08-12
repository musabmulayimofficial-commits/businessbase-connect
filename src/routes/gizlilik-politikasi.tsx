import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassPanel } from "@/components/ui/glass";

export const Route = createFileRoute("/gizlilik-politikasi")({
  head: () => ({
    meta: [
      { title: "Gizlilik Politikası — BusinessBase" },
      {
        name: "description",
        content:
          "BusinessBase'in kişisel verileri nasıl topladığı, sakladığı ve koruduğuna dair gizlilik politikası.",
      },
      { property: "og:title", content: "Gizlilik Politikası — BusinessBase" },
      { property: "og:description", content: "Verilerini nasıl koruduğumuzu açıklıyoruz." },
    ],
  }),
  component: Privacy,
});

const SECTIONS = [
  {
    title: "Topladığımız veriler",
    text: "Başvuru sırasında ad-soyad, e-posta, telefon, şehir, meslek ve girişimcilik durumu bilgilerini alırız. Üyelik sonrasında profilinde paylaşmayı seçtiğin biyografi, sektör, yetenek ve ilgi alanı bilgileri saklanır.",
  },
  {
    title: "Verileri neden kullanıyoruz",
    text: "Verilerin yalnızca üyeliğini değerlendirmek, seni network içinde diğer üyelere göstermek, bildirim göndermek ve platformun güvenliğini sağlamak için kullanılır.",
  },
  {
    title: "Kimler görebilir",
    text: "Profil bilgilerin diğer üyeler tarafından görülebilir. E-posta ve telefon numaran hiçbir zaman diğer üyelere gösterilmez. Profil fotoğrafların özel depolamada tutulur ve yalnızca kısa süreli imzalı bağlantılarla gösterilir.",
  },
  {
    title: "Mesajlaşma",
    text: "Özel mesajların yalnızca sen ve konuştuğun kişi tarafından okunabilir. Veritabanı düzeyinde satır bazlı güvenlik kuralları ile korunur.",
  },
  {
    title: "Üçüncü taraflar",
    text: "Verilerini reklam amacıyla üçüncü taraflarla paylaşmıyor, satmıyoruz. Altyapı sağlayıcılarımız yalnızca hizmetin çalışması için gerekli veriyi işler.",
  },
  {
    title: "Haklarına dair",
    text: "Dilediğin zaman profil bilgilerini güncelleyebilir, hesabının ve verilerinin silinmesini talep edebilirsin. Talebin en geç 30 gün içinde yerine getirilir.",
  },
];

function Privacy() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-3xl">
        <h1 className="animate-fade-up text-4xl font-extrabold sm:text-5xl">Gizlilik Politikası</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          Bu politika, BusinessBase&apos;e üye olduğunda veya başvuru yaptığında paylaştığın kişisel
          verilerin nasıl işlendiğini açıklar.
        </p>
        <div className="mt-10 space-y-4">
          {SECTIONS.map((s) => (
            <GlassPanel key={s.title} className="p-6">
              <h2 className="text-lg font-semibold">{s.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </GlassPanel>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
