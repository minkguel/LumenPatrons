import React from "react";

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({
  label,
  error,
  id,
  options,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-foreground/80"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`w-full bg-bg-cream border rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-lumen-teal focus:ring-1 focus:ring-lumen-teal/40 transition-all text-foreground ${
          error ? "border-red-400" : "border-lumen-teal/25"
        } ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
