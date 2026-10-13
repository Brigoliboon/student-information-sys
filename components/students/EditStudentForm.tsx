"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import Dialog from "@/components/ui/Dialog";

interface EditProps {
  id: string;
  initial: {
    first_name: string;
    last_name: string;
    middle_name: string | null;
    email: string | null;
    year_level: number | null;
    status: string;
    contact_number: string | null;
    address: string | null;
  };
}

const input_cls =
  "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function EditStudentForm({ id, initial }: EditProps) {
  const router = useRouter();
  const [open, set_open] = useState(false);
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [form, set_form] = useState({
    first_name: initial.first_name,
    last_name: initial.last_name,
    middle_name: initial.middle_name ?? "",
    email: initial.email ?? "",
    year_level: initial.year_level != null ? String(initial.year_level) : "",
    status: initial.status,
    contact_number: initial.contact_number ?? "",
    address: initial.address ?? "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    set_form((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_loading(true);
    set_error(null);
    const res = await fetch(`/api/v1/students/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        first_name: form.first_name,
        last_name: form.last_name,
        middle_name: form.middle_name || null,
        email: form.email || null,
        year_level: form.year_level ? Number(form.year_level) : null,
        status: form.status,
        contact_number: form.contact_number || null,
        address: form.address || null,
      }),
    });
    const body = await res.json().catch(() => null);
    set_loading(false);
    if (!res.ok) {
      const detail = body?.errors?.[0]?.message;
      set_error(detail ? `${body.message}: ${detail}` : (body?.message ?? "Could not update student."));
      return;
    }
    set_open(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => set_open(true)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
      >
        <Pencil size={14} />
        Edit profile
      </button>
      <Dialog open={open} on_close={() => set_open(false)} title="Edit profile" description="Update the student record." wide>
        <form onSubmit={submit}>
          {error && (
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">First name *</span><input required value={form.first_name} onChange={set("first_name")} className={input_cls} /></label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Last name *</span><input required value={form.last_name} onChange={set("last_name")} className={input_cls} /></label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Middle name</span><input value={form.middle_name} onChange={set("middle_name")} className={input_cls} /></label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Email</span><input type="email" value={form.email} onChange={set("email")} className={input_cls} /></label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Year level</span>
              <select value={form.year_level} onChange={set("year_level")} className={input_cls}>
                <option value="">Select…</option>
                {[1, 2, 3, 4, 5, 6].map((y) => (
                  <option key={y} value={y}>Year {y}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Status</span>
              <select value={form.status} onChange={set("status")} className={input_cls}>
                {["active", "inactive", "graduated", "suspended", "dropped"].map((s) => (
                  <option key={s} value={s} className="capitalize">{s}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Contact number</span><input value={form.contact_number} onChange={set("contact_number")} className={input_cls} /></label>
            <label className="block text-sm"><span className="mb-1.5 block font-medium text-zinc-700">Address</span><input value={form.address} onChange={set("address")} className={input_cls} /></label>
          </div>
          <div className="mt-5 flex gap-2">
            <button type="submit" disabled={loading} className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60">
              {loading ? "Saving…" : "Save changes"}
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
