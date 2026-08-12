import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, TextInput } from "@/components/ui/form-field";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/giris-yap")({
  head: () => ({
    meta: [
      { title: "Giriş Yap — BusinessBase" },
      { name: "description", content: "BusinessBase hesabına giriş yap ve network'e eriş." },
      { property: "og:title", content: "Giriş Yap — BusinessBase" },
      { property: "og:description", content: "BusinessBase hesabına giriş yap." },
    ],
  }),
  component: SignIn,
});

function SignIn() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && user) navigate({ to: "/ana-panel", replace: true });
  }, [user, authLoading, navigate]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");
    if (!email || !password) {
      toast.error("E-posta ve şifre gerekli.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("E-posta veya şifre hatalı.");
      return;
    }
    navigate({ to: "/ana-panel" });
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md">
        <GlassPanel level={2} className="animate-fade-up p-7 sm:p-9">
          <h1 className="text-2xl font-bold">Tekrar hoş geldin</h1>
          <p className="mt-2 text-sm text-muted-foreground">Hesabına giriş yap.</p>
          <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
            <FormField label="E-posta" htmlFor="email">
              <TextInput id="email" name="email" type="email" autoComplete="email" />
            </FormField>
            <FormField label="Şifre" htmlFor="password">
              <TextInput
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
              />
            </FormField>
            <GlassButton type="submit" variant="primary" className="w-full" loading={loading}>
              Giriş Yap
            </GlassButton>
          </form>
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            <p>
              <Link to="/sifremi-unuttum" className="text-foreground hover:underline">
                Şifremi unuttum
              </Link>
            </p>
            <p>
              Hesabın yok mu?{" "}
              <Link to="/networke-katil" className="text-foreground hover:underline">
                Network&apos;e katıl
              </Link>
            </p>
          </div>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
