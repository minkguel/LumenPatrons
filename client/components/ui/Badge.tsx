import React from "react";

type BadgeVariant = "teal" | "gold" | "neutral" | "status";

type BadgeProps = {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variantClasses: Record<BadgeVariant, string> = {
  teal: "bg-lumen-teal-light text-lumen-teal",
  gold: "bg-patron-gold-light text-patron-gold-dark",
  neutral: "bg-foreground/5 text-foreground/60",
  status: "bg-lumen-teal/10 text-lumen-teal",
};

export function Badge({
  children,
  variant = "teal",
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
