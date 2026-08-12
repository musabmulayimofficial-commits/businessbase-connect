import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();
const inflight = new Map<string, Promise<string | null>>();

async function resolve(path: string): Promise<string | null> {
  if (cache.has(path)) return cache.get(path)!;
  if (inflight.has(path)) return inflight.get(path)!;
  const p = supabase.storage
    .from("avatars")
    .createSignedUrl(path, 60 * 60 * 24)
    .then(({ data }) => {
      const url = data?.signedUrl ?? null;
      if (url) cache.set(path, url);
      return url;
    })
    .finally(() => inflight.delete(path));
  inflight.set(path, p);
  return p;
}

export function invalidateAvatar(path?: string | null) {
  if (path) cache.delete(path);
}

/** Resolves a stored avatar object path to a temporary signed URL. */
export function useAvatarUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(() => (path ? (cache.get(path) ?? null) : null));

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    if (path.startsWith("http")) {
      setUrl(path);
      return;
    }
    resolve(path).then((next) => {
      if (active) setUrl(next);
    });
    return () => {
      active = false;
    };
  }, [path]);

  return url;
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "BB";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase();
}
