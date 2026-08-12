import * as React from "react";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-lg bg-glass-1 border border-border px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-primary/60 focus:bg-glass-2 focus:ring-2 focus:ring-ring disabled:opacity-50";

export function FormField({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string | undefined;
  htmlFor?: string | undefined;
  error?: string | undefined;
  hint?: string | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      {children}
      {hint && !error ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const TextInput = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(controlClass, className)} {...props} />
  ),
);
TextInput.displayName = "TextInput";

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(controlClass, "min-h-28 resize-y", className)} {...props} />
  ),
);
TextArea.displayName = "TextArea";

export const SelectInput = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(controlClass, "appearance-none", className)} {...props}>
      {children}
    </select>
  ),
);
SelectInput.displayName = "SelectInput";
