import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, TextInput } from "@/components/ui/form-field";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyProfile } from "@/lib/hooks";

export const Route = createFileRoute("/_authenticated/ayarlar")({
  head: () => ({
    meta: [
      { title: "Ayarlar — BusinessBase" },
      { name: "description", content: "Bildirim tercihlerini ve hesap güvenliğini yönet." },
      { property: "og:title", content: "Ayarlar — BusinessBase" },
      { property: "og:description", content: "Hesap ve bildirim ayarların." },
    ],
  }),
  component: Settings,
});

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-6 rounded-lg p-3 transition-colors hover:bg-glass-1">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 size-5 shrink-0 accent-[var(--primary)]"
      />
    </label>
  );
}

function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useMyProfile();
  const [prefs, setPrefs] = useState({
    notify_connections: true,
    notify_messages: true,
    notify_events: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setPrefs({
      notify_connections: profile.notify_connections,
      notify_messages: profile.notify_messages,
      notify_events: profile.notify_events,
    });
  }, [profile]);

  async function savePrefs() {
    setSavingPrefs(true);
    const { error } = await supabase.from("profiles").update(prefs).eq("id", user!.id);
    setSavingPrefs(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Tercihlerin kaydedildi.");
    queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password") ?? "");
    if (password.length < 8) {
      toast.error("Şifre en az 8 karakter olmalı.");
      return;
    }
    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSavingPassword(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Şifren güncellendi.");
    e.currentTarget.reset();
  }

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/giris-yap", replace: true });
  }

  return (
    <AppShell title="Ayarlar" description="Hesabını ve bildirim tercihlerini yönet.">
      <div className="space-y-4">
        <GlassPanel level={2} className="p-6">
          <h2 className="text-lg font-semibold">Hesap</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Giriş yaptığın e-posta: <span className="text-foreground">{user?.email}</span>
          </p>
        </GlassPanel>

        <GlassPanel level={2} className="p-6">
          <h2 className="text-lg font-semibold">Bildirim tercihleri</h2>
          <div className="mt-4 space-y-1">
            <Toggle
              label="Bağlantı bildirimleri"
              description="Yeni bağlantı istekleri ve kabul edilen istekler."
              checked={prefs.notify_connections}
              onChange={(v) => setPrefs((p) => ({ ...p, notify_connections: v }))}
            />
            <Toggle
              label="Mesaj bildirimleri"
              description="Sana yeni bir mesaj geldiğinde bildirim al."
              checked={prefs.notify_messages}
              onChange={(v) => setPrefs((p) => ({ ...p, notify_messages: v }))}
            />
            <Toggle
              label="Etkinlik bildirimleri"
              description="Yeni etkinlikler ve hatırlatmalar."
              checked={prefs.notify_events}
              onChange={(v) => setPrefs((p) => ({ ...p, notify_events: v }))}
            />
          </div>
          <GlassButton variant="primary" className="mt-5" loading={savingPrefs} onClick={savePrefs}>
            Tercihleri Kaydet
          </GlassButton>
        </GlassPanel>

        <GlassPanel level={2} className="p-6">
          <h2 className="text-lg font-semibold">Şifre değiştir</h2>
          <form onSubmit={changePassword} className="mt-4 max-w-sm space-y-4" noValidate>
            <FormField label="Yeni şifre" htmlFor="password" hint="En az 8 karakter">
              <TextInput id="password" name="password" type="password" autoComplete="new-password" />
            </FormField>
            <GlassButton type="submit" loading={savingPassword}>
              Şifreyi Güncelle
            </GlassButton>
          </form>
        </GlassPanel>

        <GlassPanel level={2} className="p-6">
          <h2 className="text-lg font-semibold">Oturum</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Bu cihazdaki oturumunu kapat. Destek için bize ulaş: destek@businessbase.app
          </p>
          <GlassButton variant="danger" className="mt-5" onClick={signOut}>
            Çıkış Yap
          </GlassButton>
        </GlassPanel>
      </div>
    </AppShell>
  );
}
