const styles: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  inactive: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  graduated: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  suspended: "bg-amber-50 text-amber-700 ring-amber-200",
  dropped: "bg-red-50 text-red-700 ring-red-200",
  enrolled: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  withdrawn: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  open: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  closed: "bg-zinc-100 text-zinc-600 ring-zinc-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  upcoming: "bg-sky-50 text-sky-700 ring-sky-200",
  ongoing: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  passed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  failed: "bg-red-50 text-red-700 ring-red-200",
  incomplete: "bg-amber-50 text-amber-700 ring-amber-200",
  administrator: "bg-violet-50 text-violet-700 ring-violet-200",
  registrar: "bg-sky-50 text-sky-700 ring-sky-200",
  instructor: "bg-amber-50 text-amber-700 ring-amber-200",
  student: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export default function Badge({ value }: { value: string }) {
  const key = value.toLowerCase();
  const cls = styles[key] ?? "bg-zinc-100 text-zinc-600 ring-zinc-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${cls}`}
    >
      {value}
    </span>
  );
}
