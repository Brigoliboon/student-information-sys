export interface page_params {
  page: number;
  per_page: number;
  sort?: string;
  search?: string;
  filters: Record<string, string>;
}

const RESERVED = new Set(["page", "per_page", "sort", "search"]);

export const parse_page_params = (sp: Record<string, string | undefined>): page_params => {
  const page = Math.max(1, Number(sp.page ?? 1) || 1);
  const per_page = Math.min(Math.max(1, Number(sp.per_page ?? 15) || 15), 100);
  const filters: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (!RESERVED.has(k) && v) filters[k] = v;
  }
  return { page, per_page, sort: sp.sort, search: sp.search, filters };
};

export const page_href = (base: string, sp: Record<string, string | undefined>, page: number) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...sp, page: String(page) })) {
    if (v) params.set(k, v);
  }
  return `${base}?${params.toString()}`;
};

// Light-mode shared styles (tables removed — card UI only).
export const input_cls =
  "h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";
export const link_cls = "font-medium text-indigo-700 hover:text-indigo-500 hover:underline";
export const card_grid = "mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3";
export const card_cls =
  "group block rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md";
