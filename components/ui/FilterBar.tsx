import type { ReactNode } from "react";
import { Search } from "lucide-react";

export const filter_input_cls =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export default function FilterBar({
  children,
  on_submit_label = "Apply",
  clear_href,
}: {
  children: ReactNode;
  on_submit_label?: string;
  clear_href?: string;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
        <Search size={16} />
      </span>
      {children}
      <button
        type="submit"
        className="h-10 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {on_submit_label}
      </button>
      {clear_href && (
        <a href={clear_href} className="h-10 rounded-xl px-3 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 inline-flex items-center">
          Clear
        </a>
      )}
    </form>
  );
}
