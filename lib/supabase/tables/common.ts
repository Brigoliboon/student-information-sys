export interface list_params {
  page?: number;
  per_page?: number;
  sort?: string; // e.g. "created_at:desc,last_name:asc"
  search?: string;
  filters?: Record<string, string>;
}

export const parse_sort = (sort?: string): Array<{ col: string; asc: boolean }> => {
  if (!sort) return [{ col: "created_at", asc: false }];
  return sort.split(",").map((part) => {
    const [col, dir] = part.split(":");
    return { col: col.trim(), asc: (dir ?? "asc").toLowerCase() !== "desc" };
  });
};

export const paged_meta = (page: number, per_page: number, total: number) => ({
  page,
  per_page,
  total,
  last_page: Math.max(1, Math.ceil(total / per_page)),
});
