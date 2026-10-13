"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "email" | "number" | "date" | "select" | "textarea";
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  hint?: string;
}

interface EntityFormProps {
  action_url: string;
  method: "POST" | "PATCH" | "PUT";
  fields: FieldDef[];
  initial?: Record<string, string>;
  submit_label: string;
  compact?: boolean;
}

// Generic create/edit form backed by the /api/v1 routes (cookie session is
// sent automatically). Renders loading + API error states.
export default function EntityForm({ action_url, method, fields, initial, submit_label, compact }: EntityFormProps) {
  const router = useRouter();
  const [loading, set_loading] = useState(false);
  const [error, set_error] = useState<string | null>(null);
  const [saved, set_saved] = useState(false);
  const [values, set_values] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.name, initial?.[f.name] ?? ""]))
  );

  const set = (name: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    set_values((v) => ({ ...v, [name]: e.target.value }));

  const input_cls =
    "h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    set_loading(true);
    set_error(null);
    set_saved(false);
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.name];
      if (v === "" && !f.required) payload[f.name] = null;
      else if (f.type === "number" && v !== "") payload[f.name] = Number(v);
      else payload[f.name] = v;
    }
    const res = await fetch(action_url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    set_loading(false);
    if (!res.ok) {
      const detail = body?.errors?.[0]?.message;
      set_error(detail ? `${body.message}: ${detail}` : (body?.message ?? "Request failed."));
      return;
    }
    set_saved(true);
    router.refresh();
  };

  return (
    <form onSubmit={submit}>
      {error && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm text-emerald-700">
          Saved successfully.
        </p>
      )}
      <div className={`grid gap-3 ${compact ? "" : "mt-4 sm:grid-cols-2"}`}>
        {fields.map((f) => (
          <label key={f.name} className="block text-sm">
            <span className="mb-1.5 block font-medium text-zinc-700">
              {f.label}
              {f.required ? <span className="text-red-500"> *</span> : ""}
            </span>
            {f.type === "select" ? (
              <select required={f.required} value={values[f.name]} onChange={set(f.name)} className={input_cls}>
                <option value="">Select…</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            ) : f.type === "textarea" ? (
              <textarea
                value={values[f.name]}
                onChange={set(f.name)}
                rows={2}
                placeholder={f.label}
                className={`${input_cls} h-auto py-2`}
              />
            ) : (
              <input
                type={f.type}
                required={f.required}
                value={values[f.name]}
                onChange={set(f.name)}
                placeholder={f.label}
                className={input_cls}
              />
            )}
            {f.hint && <span className="mt-1 block text-xs text-zinc-400">{f.hint}</span>}
          </label>
        ))}
      </div>
      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="h-10 rounded-full bg-indigo-600 px-5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:opacity-60"
        >
          {loading ? "Saving…" : submit_label}
        </button>
      </div>
    </form>
  );
}
