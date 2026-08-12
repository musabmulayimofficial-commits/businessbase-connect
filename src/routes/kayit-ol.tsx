import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, TextInput } from "@/components/ui/form-field";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/kayit-ol")({
  head: () => ({
    meta: [
      { title: "Hesap Oluştur — BusinessBase" },
      {
        name: "description",
        content: "Onaylanan başvurunla BusinessBase hesabını oluştur ve network'e katıl.",
      },
      { property: "og:title", content: "Hesap Oluştur — BusinessBase" },
      { property: "og:description", content: "BusinessBase hesabını oluştur." },
    ],
  }),
  component: SignUp,
});

const schema = z.object({
  full_name: z.string().trim().min(3, "Ad soyad en az 3 karakter").max(100),
  email: z.string().trim().email("Geçerli bir e-posta gir").max(255),
  password: z.string().min(8, "Şifre en az 8 karakter olmalı").max(72),
});

function SignUp() {
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = schema.safeParse(Object.fromEntries(form));
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/profilim" });
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-md">
          <GlassPanel level={2} className="animate-fade-up p-8 text-center">
            <h1 className="text-2xl font-bold">E-postanı kontrol et</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Hesabını doğrulaman için sana bir bağlantı gönderdik. Bağlantıya tıkladıktan sonra
              giriş yapabilirsin.
            </p>
            <Link to="/giris-yap" className="mt-7 inline-block">
              <GlassButton variant="primary">Giriş sayfasına git</GlassButton>
            </Link>
          </GlassPanel>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md">
        <GlassPanel level={2} className="animate-fade-up p-7 sm:p-9">
          <h1 className="text-2xl font-bold">Hesabını oluştur</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Başvurun onaylandıysa burada hesabını oluşturabilirsin.
          </p>
          <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
            <FormField label="Ad Soyad" htmlFor="full_name" error={errors["full_name"]}>
              <TextInput id="full_name" name="full_name" autoComplete="name" />
            </FormField>
            <FormField label="E-posta" htmlFor="email" error={errors["email"]}>
              <TextInput id="email" name="email" type="email" autoComplete="email" />
            </FormField>
            <FormField
              label="Şifre"
              htmlFor="password"
              error={errors["password"]}
              hint="En az 8 karakter."
            >
              <TextInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </FormField>
            <GlassButton type="submit" variant="primary" className="w-full" loading={loading}>
              Hesabı Oluştur
            </GlassButton>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Zaten üye misin?{" "}
            <Link to="/giris-yap" className="text-foreground hover:underline">
              Giriş yap
            </Link>
          </p>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
