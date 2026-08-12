import { initials, useAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-9 text-xs",
  md: "size-12 text-sm",
  lg: "size-16 text-base",
  xl: "size-24 text-xl",
};

export function Avatar({
  path,
  name,
  size = "md",
  className,
}: {
  path?: string | null | undefined;
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const url = useAvatarUrl(path);
  return (
    <div
      className={cn(
        "glass-3 flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold text-muted-foreground",
        sizes[size],
        className,
      )}
    >
      {url ? (
        <img
          src={url}
          alt={`${name} profil fotoğrafı`}
          loading="lazy"
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </div>
  );
}
