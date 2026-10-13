"use client";

import { useState, type ReactNode } from "react";
import { Pencil } from "lucide-react";
import Dialog from "@/components/ui/Dialog";

export default function EditDialog({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [open, set_open] = useState(false);
  return (
    <>
      <button
        onClick={() => set_open(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
      >
        <Pencil size={14} />
        Edit
      </button>
      <Dialog open={open} on_close={() => set_open(false)} title={title} description={description} wide>
        {children}
      </Dialog>
    </>
  );
}
