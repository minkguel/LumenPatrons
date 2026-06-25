import React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-foreground/80"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full bg-bg-cream border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-lumen-teal focus:ring-1 focus:ring-lumen-teal/40 transition-all text-foreground placeholder-foreground/35 ${
          error ? "border-red-400" : "border-lumen-teal/25"
        } ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
