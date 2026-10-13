import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  last_page: number;
  prev_href: string | null;
  next_href: string | null;
}

export default function Pagination({ page, last_page, prev_href, next_href }: PaginationProps) {
  if (last_page <= 1) return null;
  const btn =
    "inline-flex h-9 items-center gap-1 rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 shadow-sm hover:border-zinc-300 hover:bg-zinc-50";
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      {prev_href ? (
        <a href={prev_href} className={btn}>
          <ChevronLeft size={15} /> Prev
        </a>
      ) : (
        <span className={`${btn} opacity-40 pointer-events-none`}>
          <ChevronLeft size={15} /> Prev
        </span>
      )}
      <span className="rounded-full bg-white px-4 py-1.5 text-[13px] font-medium text-zinc-600 ring-1 ring-zinc-200">
        Page {page} of {last_page}
      </span>
      {next_href ? (
        <a href={next_href} className={btn}>
          Next <ChevronRight size={15} />
        </a>
      ) : (
        <span className={`${btn} opacity-40 pointer-events-none`}>
          Next <ChevronRight size={15} />
        </span>
      )}
    </div>
  );
}
