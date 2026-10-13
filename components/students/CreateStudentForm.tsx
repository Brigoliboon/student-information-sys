"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Dialog from "@/components/ui/Dialog";

interface Program {
  id: string;
  code: string;
  name: string;
}

const input_cls =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function CreateStudentForm({ programs }: { programs: Program[] }) {
  const router = useRouter();
  const [open, set_open] = useState(false);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [form, set_form] = useState({ student_number: "", first_name: "", last_name: "", email: "", program_id: "", year_level: "" });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    set_form((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_loading(true);
    set_error(null);
    const res = await fetch("/api/v1/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_number: form.student_number,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        program_id: form.program_id || null,
        year_level: form.year_level ? Number(form.year_level) : null,
      }),
    });
    const body = await res.json().catch(() => null);
    set_loading(false);
    if (!res.ok) {
      set_error(body?.message ?? "Could not create student.");
      return;
    }
    set_open(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => set_open(true)}
        className="inline-flex h-10 items-center gap-1.5 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500"
      >
        <Plus size={16} />
        New student
      </button>
      <Dialog open={open} on_close={() => set_open(false)} title="New student" description="Add a student profile to the roster." wide>
        <form onSubmit={submit}>
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Student number *</span>
              <input required placeholder="2024-00001" value={form.student_number} onChange={set("student_number")} className={input_cls} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Email</span>
              <input type="email" placeholder="student@example.edu" value={form.email} onChange={set("email")} className={input_cls} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">First name *</span>
              <input required placeholder="First name" value={form.first_name} onChange={set("first_name")} className={input_cls} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Last name *</span>
              <input required placeholder="Last name" value={form.last_name} onChange={set("last_name")} className={input_cls} />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Program</span>
              <select value={form.program_id} onChange={set("program_id")} className={input_cls}>
                <option value="">No program</option>
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} — {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block font-medium text-zinc-700">Year level</span>
              <select value={form.year_level} onChange={set("year_level")} className={input_cls}>
                <option value="">Select…</option>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </label>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={loading} className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
              {loading ? "Saving…" : "Save student"}
            </button>
            <button type="button" onClick={() => set_open(false)} className="h-10 rounded-full border border-zinc-200 bg-white px-5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Cancel
            </button>
          </div>
        </form>
      </Dialog>
    </>
  );
}
