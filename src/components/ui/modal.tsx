import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { GlassPanel } from "@/components/ui/glass";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        aria-label="Kapat"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <GlassPanel
        level={3}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-fade-up relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl p-6 sm:rounded-2xl"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="mt-1 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            aria-label="Kapat"
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-glass-2 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </GlassPanel>
    </div>
  );
}
