import type { ReactNode } from "react";

export default function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${
        hover ? "transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
