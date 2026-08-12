import { useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { GlassButton, GlassPanel } from "@/components/ui/glass";
import { FormField, SelectInput, TextArea, TextInput } from "@/components/ui/form-field";
import { CITIES, ENTREPRENEURSHIP_STATUSES, SECTORS } from "@/lib/constants";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useMyProfile } from "@/lib/hooks";

export const Route = createFileRoute("/_authenticated/profilim")({
  head: () => ({
    meta: [
      { title: "Profilim — BusinessBase" },
      { name: "description", content: "Profilini güncelle: biyografi, sektör, yetenekler." },
      { property: "og:title", content: "Profilim — BusinessBase" },
      { property: "og:description", content: "BusinessBase profilini düzenle." },
    ],
  }),
  component: MyProfile,
});

function MyProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useMyProfile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: "",
    role: "",
    sector: "",
    city: "",
    entrepreneurship_status: "",
    bio: "",
    skills: "",
    interests: "",
  });

  useEffect(() => {
    if (!profile) return;
    setForm({
      full_name: profile.full_name ?? "",
      role: profile.role ?? "",
      sector: profile.sector ?? "",
      city: profile.city ?? "",
      entrepreneurship_status: profile.entrepreneurship_status ?? "",
      bio: profile.bio ?? "",
      skills: (profile.skills ?? []).join(", "),
      interests: (profile.interests ?? []).join(", "),
    });
  }, [profile]);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (form.full_name.trim().length < 3) {
      toast.error("Ad soyad en az 3 karakter olmalı.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        role: form.role.trim(),
        sector: form.sector,
        city: form.city,
        entrepreneurship_status: form.entrepreneurship_status,
        bio: form.bio.trim(),
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
        interests: form.interests
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 20),
      })
      .eq("id", user!.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profilin güncellendi.");
    queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
  }

  async function uploadAvatar(file: File) {
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Dosya en fazla 4 MB olabilir.");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user!.id}/avatar-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      setUploading(false);
      toast.error(uploadError.message);
      return;
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profil fotoğrafın güncellendi.");
    queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
  }

  return (
    <AppShell title="Profilim" description="Networkün seni bu bilgilerle görüyor.">
      {isLoading ? (
        <GlassPanel className="p-10 text-center text-sm text-muted-foreground">
          Yükleniyor...
        </GlassPanel>
      ) : (
        <div className="space-y-4">
          <GlassPanel level={2} className="flex flex-wrap items-center gap-6 p-6">
            <Avatar path={profile?.avatar_url} name={form.full_name || "Üye"} size="xl" />
            <div>
              <p className="text-sm font-medium">Profil fotoğrafı</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG veya PNG, en fazla 4 MB.</p>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void uploadAvatar(file);
                  e.target.value = "";
                }}
              />
              <GlassButton
                size="sm"
                className="mt-4"
                loading={uploading}
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="size-4" /> Fotoğraf Yükle
              </GlassButton>
            </div>
          </GlassPanel>

          <GlassPanel level={2} className="p-6 sm:p-8">
            <form onSubmit={save} className="space-y-5" noValidate>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Ad Soyad" htmlFor="full_name">
                  <TextInput
                    id="full_name"
                    value={form.full_name}
                    onChange={(e) => set("full_name", e.target.value)}
                  />
                </FormField>
                <FormField label="Unvan / Rol" htmlFor="role">
                  <TextInput
                    id="role"
                    placeholder="Ör. Kurucu, Ürün Yöneticisi"
                    value={form.role}
                    onChange={(e) => set("role", e.target.value)}
                  />
                </FormField>
              </div>
              <div className="grid gap-5 sm:grid-cols-3">
                <FormField label="Sektör" htmlFor="sector">
                  <SelectInput
                    id="sector"
                    value={form.sector}
                    onChange={(e) => set("sector", e.target.value)}
                  >
                    <option value="">Seç</option>
                    {SECTORS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Şehir" htmlFor="city">
                  <SelectInput
                    id="city"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                  >
                    <option value="">Seç</option>
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
                <FormField label="Girişimcilik durumu" htmlFor="entrepreneurship_status">
                  <SelectInput
                    id="entrepreneurship_status"
                    value={form.entrepreneurship_status}
                    onChange={(e) => set("entrepreneurship_status", e.target.value)}
                  >
                    <option value="">Seç</option>
                    {ENTREPRENEURSHIP_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </SelectInput>
                </FormField>
              </div>
              <FormField label="Hakkında" htmlFor="bio" hint="Ne yapıyorsun, neye ihtiyacın var?">
                <TextArea
                  id="bio"
                  maxLength={1000}
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                />
              </FormField>
              <FormField label="Yetenekler" htmlFor="skills" hint="Virgülle ayır">
                <TextInput
                  id="skills"
                  placeholder="Ürün, Satış, Yazılım"
                  value={form.skills}
                  onChange={(e) => set("skills", e.target.value)}
                />
              </FormField>
              <FormField label="İlgi alanları" htmlFor="interests" hint="Virgülle ayır">
                <TextInput
                  id="interests"
                  placeholder="SaaS, Yapay zeka, İhracat"
                  value={form.interests}
                  onChange={(e) => set("interests", e.target.value)}
                />
              </FormField>
              <GlassButton type="submit" variant="primary" loading={saving}>
                Değişiklikleri Kaydet
              </GlassButton>
            </form>
          </GlassPanel>
        </div>
      )}
    </AppShell>
  );
}
