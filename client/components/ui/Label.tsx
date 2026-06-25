import React from "react";

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", children, ...props }: LabelProps) {
  return (
    <label
      className={`block text-sm font-medium text-foreground/80 ${className}`}
      {...props}
    >
      {children}
    </label>
  );
}
