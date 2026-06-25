import React from "react";

type CardProps = {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
};

export function Card({ children, className = "", hover = false }: CardProps) {
  return (
    <div
      className={`bg-white border border-lumen-teal/15 rounded-xl p-6 ${
        hover
          ? "group hover:border-patron-gold/50 hover:shadow-md transition-all cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
