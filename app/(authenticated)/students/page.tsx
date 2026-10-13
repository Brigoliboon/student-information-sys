import { redirect } from "next/navigation";
import { Users, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { list_students } from "@/lib/supabase/tables/students";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list, can_write } from "@/services/rbac";
import CreateStudentForm from "@/components/students/CreateStudentForm";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { filter_input_cls } from "@/components/ui/FilterBar";
import { card_grid } from "@/components/crud/list_helpers";

interface StudentsSearch {
  search?: string;
  program_id?: string;
  year_level?: string;
  status?: string;
  sort?: string;
  page?: string;
  per_page?: string;
}

const page_href = (base: StudentsSearch, page: number) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, page: String(page) })) {
    if (v) sp.set(k, v);
  }
  return `/students?${sp.toString()}`;
};

export default async function StudentsPage({ searchParams }: { searchParams: Promise<StudentsSearch> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");

  if (profile.role === "student") {
    if (profile.student_id) redirect(`/students/${profile.student_id}`);
    return <p className="text-sm text-zinc-500">Your account is not linked to a student record yet.</p>;
  }
  if (!can_list(profile, "students")) redirect("/dashboard");

  const q = await searchParams;
  const page = Math.max(1, Number(q.page ?? 1) || 1);
  const per_page = Math.min(Math.max(1, Number(q.per_page ?? 15) || 15), 100);
  const filters: Record<string, string> = {};
  if (q.program_id) filters.program_id = q.program_id;
  if (q.year_level) filters.year_level = q.year_level;
  if (q.status) filters.status = q.status;

  const [{ data, meta }, programs] = await Promise.all([
    list_students({ page, per_page, sort: q.sort, search: q.search, filters }),
    create_admin_client().from("programs").select("id, code, name").order("code").then((r) => r.data ?? []),
  ]);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const can_create = can_write(profile, "students");

  return (
    <div>
      <PageHeader
        title="Students"
        description={`${meta.total} record${meta.total === 1 ? "" : "s"} · page ${meta.page} of ${meta.last_page}`}
        action={can_create && <CreateStudentForm programs={programs} />}
      />

      <div className="mt-6">
        <FilterBar clear_href="/students">
          <input name="search" defaultValue={q.search ?? ""} placeholder="Search name, number, email…" className={`${filter_input_cls} w-56`} />
          <select name="program_id" defaultValue={q.program_id ?? ""} className={filter_input_cls}>
            <option value="">All programs</option>
            {programs.map((p) => (
              <option key={p.id} value={p.id}>{p.code} — {p.name}</option>
            ))}
          </select>
          <select name="year_level" defaultValue={q.year_level ?? ""} className={filter_input_cls}>
            <option value="">All levels</option>
            {[1, 2, 3, 4, 5, 6].map((y) => (
              <option key={y} value={y}>Year {y}</option>
            ))}
          </select>
          <select name="status" defaultValue={q.status ?? ""} className={filter_input_cls}>
            <option value="">All statuses</option>
            {["active", "inactive", "graduated", "suspended", "dropped"].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
          <select name="sort" defaultValue={q.sort ?? ""} className={filter_input_cls}>
            <option value="">Newest first</option>
            <option value="last_name:asc">Last name A–Z</option>
            <option value="last_name:desc">Last name Z–A</option>
            <option value="student_number:asc">Student no. ↑</option>
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={Users} title="No students match these filters" description="Try clearing filters or add a new student." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((s) => {
            const name = `${String(s.first_name)} ${String(s.last_name)}`;
            const program = (s.programs as Record<string, unknown> | null)?.code as string | undefined;
            return (
              <a
                key={String(s.id)}
                href={`/students/${String(s.id)}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold tracking-tight text-zinc-900">{name}</p>
                    <p className="font-mono text-xs text-zinc-400">{String(s.student_number)}</p>
                  </div>
                  <ChevronRight size={16} className="mt-1 shrink-0 text-zinc-300 group-hover:text-indigo-600" />
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {program ?? "No program"} {s.year_level != null ? `· Year ${String(s.year_level)}` : ""}
                  </span>
                  <Badge value={String(s.status)} />
                </div>
              </a>
            );
          })}
        </div>
      )}

      <Pagination
        page={meta.page}
        last_page={meta.last_page}
        prev_href={meta.page > 1 ? page_href(q, meta.page - 1) : null}
        next_href={meta.page < meta.last_page ? page_href(q, meta.page + 1) : null}
      />
    </div>
  );
}
