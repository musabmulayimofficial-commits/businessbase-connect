import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, TextInput } from "@/components/ui/form-field";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sifremi-unuttum")({
  head: () => ({
    meta: [
      { title: "Şifremi Unuttum — BusinessBase" },
      { name: "description", content: "BusinessBase hesabının şifresini sıfırla." },
      { property: "og:title", content: "Şifremi Unuttum — BusinessBase" },
      { property: "og:description", content: "Şifreni sıfırlamak için e-posta gönder." },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!email) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-sifirla`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md">
        <GlassPanel level={2} className="animate-fade-up p-7 sm:p-9">
          <h1 className="text-2xl font-bold">Şifreni sıfırla</h1>
          {sent ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Eğer bu e-posta ile kayıtlı bir hesap varsa, şifre sıfırlama bağlantısı gönderildi.
              Gelen kutunu kontrol et.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-muted-foreground">
                E-posta adresini gir, sıfırlama bağlantısı gönderelim.
              </p>
              <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
                <FormField label="E-posta" htmlFor="email">
                  <TextInput id="email" name="email" type="email" autoComplete="email" />
                </FormField>
                <GlassButton type="submit" variant="primary" className="w-full" loading={loading}>
                  Bağlantı Gönder
                </GlassButton>
              </form>
            </>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/giris-yap" className="text-foreground hover:underline">
              Giriş sayfasına dön
            </Link>
          </p>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
