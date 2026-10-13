"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import Dialog from "@/components/ui/Dialog";

export default function CreateDialog({
  label,
  title,
  description,
  children,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const [open, set_open] = useState(false);
  return (
    <>
      <button
        onClick={() => set_open(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
      >
        <Plus size={16} />
        {label}
      </button>
      <Dialog open={open} on_close={() => set_open(false)} title={title} description={description} wide>
        {children}
      </Dialog>
    </>
  );
}
