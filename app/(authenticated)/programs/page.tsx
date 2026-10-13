import { redirect } from "next/navigation";
import { Library, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { programs_repo } from "@/lib/supabase/tables/catalog";
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
  { name: "code", label: "Code", type: "text", required: true },
  { name: "name", label: "Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
  { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
];

export default async function ProgramsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "programs")) redirect("/dashboard");

  const sp = await searchParams;
  const q = parse_page_params(sp);
  const { data, meta } = await programs_repo().list(q);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const editable = can_write(profile, "programs");

  return (
    <div>
      <PageHeader
        title="Programs"
        description={`${meta.total} record${meta.total === 1 ? "" : "s"} · Browse academic programs as cards`}
        action={
          editable && (
            <CreateDialog label="New program" title="New program" description="Create an academic program.">
              <EntityForm action_url="/api/v1/programs" method="POST" fields={FIELDS} submit_label="Save program" />
            </CreateDialog>
          )
        }
      />

      <div className="mt-6">
        <FilterBar clear_href="/programs">
          <input name="search" defaultValue={q.search ?? ""} placeholder="Search code or name…" className={`${filter_input_cls} w-56`} />
          <select name="status" defaultValue={q.filters.status ?? ""} className={filter_input_cls}>
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={Library}
            title="No programs found"
            description="Try a different search, or create a new program to get started."
          />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((r) => (
            <a key={String(r.id)} href={`/programs/${String(r.id)}`} className={card_cls}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                  <Library size={20} />
                </span>
                <Badge value={String(r.status)} />
              </div>
              <p className="mt-4 font-mono text-xs font-medium uppercase tracking-widest text-zinc-400">
                {String(r.code)}
              </p>
              <p className="mt-1 font-semibold tracking-tight text-zinc-900">{String(r.name)}</p>
              {typeof r.description === "string" && r.description !== "" && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{r.description}</p>
              )}
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
        prev_href={meta.page > 1 ? page_href("/programs", sp, meta.page - 1) : null}
        next_href={meta.page < meta.last_page ? page_href("/programs", sp, meta.page + 1) : null}
      />
    </div>
  );
}
