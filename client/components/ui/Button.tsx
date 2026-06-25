import React from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-patron-gold hover:bg-patron-gold-dark text-white font-semibold shadow-sm",
  secondary:
    "bg-lumen-teal hover:bg-lumen-teal-dark text-white font-semibold shadow-sm",
  ghost:
    "text-foreground/60 hover:text-lumen-teal bg-transparent font-medium",
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
