import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { CITIES, ENTREPRENEURSHIP_STATUSES } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/networke-katil")({
  head: () => ({
    meta: [
      { title: "Network'e Katıl — BusinessBase" },
      {
        name: "description",
        content:
          "BusinessBase girişimci networküne başvur. Başvurun değerlendirildikten sonra üyeliğin açılır.",
      },
      { property: "og:title", content: "Network'e Katıl — BusinessBase" },
      { property: "og:description", content: "Girişimci networküne başvurunu gönder." },
    ],
  }),
  component: Join,
});

const schema = z.object({
  full_name: z.string().trim().min(3, "Ad soyad en az 3 karakter olmalı").max(100),
  email: z.string().trim().email("Geçerli bir e-posta gir").max(255),
  phone: z.string().trim().min(10, "Geçerli bir telefon gir").max(20),
  city: z.string().trim().min(1, "Şehir seç"),
  profession: z.string().trim().min(2, "Mesleğini yaz").max(120),
  entrepreneurship_status: z.string().trim().min(1, "Durumunu seç"),
  reason: z
    .string()
    .trim()
    .min(30, "Lütfen en az 30 karakter yaz")
    .max(1000, "En fazla 1000 karakter"),
});

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

function Join() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = Object.fromEntries(form) as Record<string, string>;
    const parsed = schema.safeParse(raw);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof Errors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const result = await submit({ data: parsed.data });
      if (result.duplicate) {
        toast.info("Bu e-posta ile zaten bir başvurun var. Değerlendirme sürüyor.");
      }
      navigate({ to: "/basvuru-alindi" });
    } catch {
      toast.error("Başvuru gönderilemedi. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-2xl">
        <h1 className="animate-fade-up text-4xl font-extrabold sm:text-5xl">Network&apos;e Katıl</h1>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          BusinessBase üyeliği başvuru ile açılır. Formu doldur, ekibimiz başvurunu değerlendirsin.
          Onaylandığında e-posta ile bilgilendirilirsin.
        </p>

        <GlassPanel level={2} className="animate-fade-up mt-10 p-6 sm:p-8">
          <form onSubmit={onSubmit} className="space-y-5" noValidate>
            <FormField label="Ad Soyad" htmlFor="full_name" error={errors.full_name}>
              <TextInput id="full_name" name="full_name" placeholder="Adın ve soyadın" />
            </FormField>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="E-posta" htmlFor="email" error={errors.email}>
                <TextInput id="email" name="email" type="email" placeholder="ornek@mail.com" />
              </FormField>
              <FormField label="Telefon" htmlFor="phone" error={errors.phone}>
                <TextInput id="phone" name="phone" placeholder="05XX XXX XX XX" />
              </FormField>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Şehir" htmlFor="city" error={errors.city}>
                <SelectInput id="city" name="city" defaultValue="">
                  <option value="" disabled>
                    Seç
                  </option>
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </SelectInput>
              </FormField>
              <FormField label="Meslek" htmlFor="profession" error={errors.profession}>
                <TextInput id="profession" name="profession" placeholder="Ör. Yazılım girişimcisi" />
              </FormField>
            </div>
            <FormField
              label="Girişimcilik Durumu"
              htmlFor="entrepreneurship_status"
              error={errors.entrepreneurship_status}
            >
              <SelectInput id="entrepreneurship_status" name="entrepreneurship_status" defaultValue="">
                <option value="" disabled>
                  Seç
                </option>
                {ENTREPRENEURSHIP_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField
              label="Neden BusinessBase?"
              htmlFor="reason"
              error={errors.reason}
              hint="Ne yaptığını ve networkten ne beklediğini kısaca anlat."
            >
              <TextArea
                id="reason"
                name="reason"
                maxLength={1000}
                placeholder="Şu an üzerinde çalıştığım şey..."
              />
            </FormField>
            <GlassButton type="submit" variant="primary" size="lg" loading={loading} className="w-full">
              Başvuruyu Gönder
            </GlassButton>
          </form>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
