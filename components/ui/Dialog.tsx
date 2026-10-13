"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

export default function Dialog({
  open,
  on_close,
  title,
  description,
  children,
  wide = false,
}: {
  open: boolean;
  on_close: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const on_key = (e: KeyboardEvent) => {
      if (e.key === "Escape") on_close();
    };
    window.addEventListener("keydown", on_key);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", on_key);
      document.body.style.overflow = "";
    };
  }, [open, on_close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        aria-label="Close dialog"
        onClick={on_close}
        className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={`dialog-panel relative w-full ${wide ? "max-w-2xl" : "max-w-lg"} rounded-3xl border border-zinc-200 bg-white p-6 shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{title}</h2>
            {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
          </div>
          <button
            onClick={on_close}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
