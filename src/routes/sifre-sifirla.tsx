import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { PublicLayout } from "@/components/PublicLayout";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, TextInput } from "@/components/ui/form-field";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/sifre-sifirla")({
  head: () => ({
    meta: [
      { title: "Yeni Şifre Belirle — BusinessBase" },
      { name: "description", content: "BusinessBase hesabın için yeni bir şifre belirle." },
      { property: "og:title", content: "Yeni Şifre Belirle — BusinessBase" },
      { property: "og:description", content: "Hesabın için yeni şifre belirle." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");
    if (password.length < 8) {
      setError("Şifre en az 8 karakter olmalı.");
      return;
    }
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    setError(undefined);
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      toast.error(updateError.message);
      return;
    }
    toast.success("Şifren güncellendi.");
    navigate({ to: "/ana-panel" });
  }

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md">
        <GlassPanel level={2} className="animate-fade-up p-7 sm:p-9">
          <h1 className="text-2xl font-bold">Yeni şifre belirle</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu sayfayı e-postandaki bağlantı üzerinden açtığından emin ol.
          </p>
          <form onSubmit={onSubmit} className="mt-7 space-y-5" noValidate>
            <FormField label="Yeni şifre" htmlFor="password" error={error}>
              <TextInput
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
              />
            </FormField>
            <FormField label="Yeni şifre (tekrar)" htmlFor="confirm">
              <TextInput id="confirm" name="confirm" type="password" autoComplete="new-password" />
            </FormField>
            <GlassButton type="submit" variant="primary" className="w-full" loading={loading}>
              Şifreyi Güncelle
            </GlassButton>
          </form>
        </GlassPanel>
      </div>
    </PublicLayout>
  );
}
