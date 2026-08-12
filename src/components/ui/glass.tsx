import * as React from "react";
import { cn } from "@/lib/utils";

type Level = 1 | 2 | 3;

const levelClass: Record<Level, string> = {
  1: "glass",
  2: "glass-2",
  3: "glass-3",
};

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  level?: Level;
  hover?: boolean;
  as?: "div" | "section" | "article" | "aside" | "nav" | "header" | "footer";
}

export const GlassPanel = React.forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, level = 1, hover = false, as: Tag = "div", ...props }, ref) => (
    <Tag
      ref={ref as never}
      className={cn(
        levelClass[level],
        "rounded-xl transition-[transform,box-shadow,background-color] duration-300",
        hover && "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] hover:bg-glass-2",
        className,
      )}
      {...props}
    />
  ),
);
GlassPanel.displayName = "GlassPanel";

type ButtonVariant = "primary" | "glass" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-primary text-primary-foreground border border-primary/40 shadow-[0_10px_30px_-12px_var(--primary)] hover:bg-primary/90",
  glass: "glass-2 text-foreground hover:bg-glass-3",
  ghost: "text-muted-foreground hover:text-foreground hover:bg-glass-1 border border-transparent",
  danger: "bg-destructive/15 text-destructive border border-destructive/40 hover:bg-destructive/25",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
  icon: "h-10 w-10",
};

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = "glass", size = "md", loading, disabled, children, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-tight",
        "transition-all duration-200 active:scale-[0.98]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
      {...props}
    >
      {loading ? (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      ) : null}
      {children}
    </button>
  ),
);
GlassButton.displayName = "GlassButton";
