import type { NextRequest } from "next/server";

export interface list_query {
  page: number;
  per_page: number;
  sort?: string;
  search?: string;
  filters: Record<string, string>;
}

const RESERVED = new Set(["page", "per_page", "sort", "search"]);

export const parse_list_params = (req: NextRequest): list_query => {
  const sp = req.nextUrl.searchParams;
  const page = Math.max(1, Number(sp.get("page") ?? 1) || 1);
  const per_page = Math.min(Math.max(1, Number(sp.get("per_page") ?? 15) || 15), 100);
  const sort = sp.get("sort") ?? undefined;
  const search = sp.get("search") ?? undefined;
  const filters: Record<string, string> = {};
  sp.forEach((v, k) => {
    if (!RESERVED.has(k) && v !== "") filters[k] = v;
  });
  return { page, per_page, sort, search, filters };
};
