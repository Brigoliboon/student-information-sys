import { redirect } from "next/navigation";
import { CalendarDays, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { terms_repo } from "@/lib/supabase/tables/catalog";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { filter_input_cls } from "@/components/ui/FilterBar";
import EntityForm, { type FieldDef } from "@/components/crud/EntityForm";
import CreateDialog from "@/components/crud/CreateDialog";
import { parse_page_params, page_href, card_grid, card_cls } from "@/components/crud/list_helpers";

const SEMESTERS = ["1st", "2nd", "summer"];

const FIELDS: FieldDef[] = [
  { name: "school_year", label: "School year", type: "text", required: true, hint: "e.g. 2025-2026" },
  { name: "semester", label: "Semester", type: "select", required: true, options: SEMESTERS.map((s) => ({ value: s, label: s })) },
  { name: "start_date", label: "Start date", type: "date" },
  { name: "end_date", label: "End date", type: "date" },
  { name: "status", label: "Status", type: "select", options: ["upcoming", "ongoing", "closed"].map((s) => ({ value: s, label: s })) },
];

export default async function TermsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "terms")) redirect("/dashboard");

  const sp = await searchParams;
  const q = parse_page_params(sp);
  const { data, meta } = await terms_repo().list(q);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const editable = can_write(profile, "terms");

  return (
    <div>
      <PageHeader
        title="Academic terms"
        description={`${meta.total} record${meta.total === 1 ? "" : "s"} · School years and semesters`}
        action={
          editable && (
            <CreateDialog label="New term" title="New academic term" description="Define a school year and semester.">
              <EntityForm action_url="/api/v1/academic-terms" method="POST" fields={FIELDS} submit_label="Save term" />
            </CreateDialog>
          )
        }
      />

      <div className="mt-6">
        <FilterBar clear_href="/academic-terms">
          <input name="search" defaultValue={q.search ?? ""} placeholder="Search year…" className={`${filter_input_cls} w-56`} />
          <select name="status" defaultValue={q.filters.status ?? ""} className={filter_input_cls}>
            <option value="">All statuses</option>
            {["upcoming", "ongoing", "closed"].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={CalendarDays} title="No terms found" description="Create an academic term to get started." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((r) => (
            <a key={String(r.id)} href={`/academic-terms/${String(r.id)}`} className={card_cls}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                  <CalendarDays size={20} />
                </span>
                <Badge value={String(r.status)} />
              </div>
              <p className="mt-4 text-lg font-semibold tracking-tight text-zinc-900">{String(r.school_year)}</p>
              <p className="text-sm capitalize text-zinc-500">
                {String(r.semester)} semester · {r.start_date ? String(r.start_date) : "—"} → {r.end_date ? String(r.end_date) : "—"}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
                View details <ChevronRight size={15} />
              </span>
            </a>
          ))}
        </div>
      )}

      <Pagination
        page={meta.page}
        last_page={meta.last_page}
        prev_href={meta.page > 1 ? page_href("/academic-terms", sp, meta.page - 1) : null}
        next_href={meta.page < meta.last_page ? page_href("/academic-terms", sp, meta.page + 1) : null}
      />
    </div>
  );
}
