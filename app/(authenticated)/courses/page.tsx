import { redirect } from "next/navigation";
import { BookOpen, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { courses_repo } from "@/lib/supabase/tables/catalog";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { filter_input_cls } from "@/components/ui/FilterBar";
import EntityForm, { type FieldDef } from "@/components/crud/EntityForm";
import CreateDialog from "@/components/crud/CreateDialog";
import { parse_page_params, page_href, card_grid, card_cls } from "@/components/crud/list_helpers";

const FIELDS: FieldDef[] = [
  { name: "course_code", label: "Course code", type: "text", required: true },
  { name: "title", label: "Title", type: "text", required: true },
  { name: "units", label: "Units", type: "number", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
];

export default async function CoursesPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "courses")) redirect("/dashboard");

  const sp = await searchParams;
  const q = parse_page_params(sp);
  const { data, meta } = await courses_repo().list(q);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const editable = can_write(profile, "courses");

  return (
    <div>
      <PageHeader
        title="Courses"
        description={`${meta.total} record${meta.total === 1 ? "" : "s"} · Course catalog in cards`}
        action={
          editable && (
            <CreateDialog label="New course" title="New course" description="Add a course to the catalog.">
              <EntityForm action_url="/api/v1/courses" method="POST" fields={FIELDS} submit_label="Save course" />
            </CreateDialog>
          )
        }
      />

      <div className="mt-6">
        <FilterBar clear_href="/courses">
          <input name="search" defaultValue={q.search ?? ""} placeholder="Search code or title…" className={`${filter_input_cls} w-56`} />
          <select name="status" defaultValue={q.filters.status ?? ""} className={filter_input_cls}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={BookOpen} title="No courses found" description="Adjust your filters or add a new course." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((r) => (
            <a key={String(r.id)} href={`/courses/${String(r.id)}`} className={card_cls}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                  <BookOpen size={20} />
                </span>
                <Badge value={String(r.status)} />
              </div>
              <p className="mt-4 font-mono text-xs font-medium uppercase tracking-widest text-zinc-400">
                {String(r.course_code)} · {String(r.units)} units
              </p>
              <p className="mt-1 font-semibold tracking-tight text-zinc-900">{String(r.title)}</p>
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
        prev_href={meta.page > 1 ? page_href("/courses", sp, meta.page - 1) : null}
        next_href={meta.page < meta.last_page ? page_href("/courses", sp, meta.page + 1) : null}
      />
    </div>
  );
}
