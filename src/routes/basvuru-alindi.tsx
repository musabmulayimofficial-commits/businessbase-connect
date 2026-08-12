import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";

export const Route = createFileRoute("/basvuru-alindi")({
  head: () => ({
    meta: [
      { title: "Başvurun Alındı — BusinessBase" },
      {
        name: "description",
        content: "BusinessBase başvurun bize ulaştı. Değerlendirme sonrası e-posta ile döneceğiz.",
      },
      { property: "og:title", content: "Başvurun Alındı — BusinessBase" },
      { property: "og:description", content: "Başvurun bize ulaştı." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Received,
});

function Received() {
  return (
    <PublicLayout>
      <div className="mx-auto max-w-xl">
        <GlassPanel level={2} className="animate-fade-up p-8 text-center sm:p-12">
          <CheckCircle2 className="mx-auto size-12 text-primary" aria-hidden />
          <h1 className="mt-6 text-3xl font-extrabold">Başvurun alındı</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Teşekkürler. Başvurunu genellikle 3 iş günü içinde değerlendiriyoruz. Sonuç e-posta
            adresine gönderilecek. Onaylandığında hesabını oluşturup network&apos;e giriş
            yapabileceksin.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/">
              <GlassButton className="w-full sm:w-auto">Ana sayfaya dön</GlassButton>
            </Link>
            <Link to="/etkinlikler">
              <GlassButton variant="primary" className="w-full sm:w-auto">
                Etkinliklere göz at
              </GlassButton>
            </Link>
          </div>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
