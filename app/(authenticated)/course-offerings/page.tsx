import { redirect } from "next/navigation";
import { Layers, ChevronRight, Clock, Users } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { filter_input_cls } from "@/components/ui/FilterBar";
import EntityForm, { type FieldDef } from "@/components/crud/EntityForm";
import CreateDialog from "@/components/crud/CreateDialog";
import { parse_page_params, page_href, card_grid } from "@/components/crud/list_helpers";

export default async function OfferingsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "offerings")) redirect("/dashboard");

  const sp = await searchParams;
  const q = parse_page_params(sp);
  const admin = create_admin_client();

  const build = () => {
    let query = admin
      .from("course_offerings")
      .select("*, courses(id, course_code, title), academic_terms(id, school_year, semester)", { count: "exact" });
    for (const [k, v] of Object.entries(q.filters)) {
      if (["course_id", "academic_term_id", "instructor_id", "status"].includes(k)) query = query.eq(k, v);
    }
    if (q.search) query = query.ilike("section", `%${q.search}%`);
    const [col, dir] = (q.sort ?? "created_at:desc").split(":");
    return query.order(col, { ascending: (dir ?? "desc") !== "desc" });
  };
  const { data, count } = await build().range((q.page - 1) * q.per_page, q.page * q.per_page - 1);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const total = count ?? 0;
  const last_page = Math.max(1, Math.ceil(total / q.per_page));
  const editable = can_write(profile, "offerings");

  const [courses, terms, instructors] = await Promise.all([
    admin.from("courses").select("id, course_code, title").eq("status", "active").order("course_code").then((r) => r.data ?? []),
    admin.from("academic_terms").select("id, school_year, semester").order("school_year", { ascending: false }).then((r) => r.data ?? []),
    admin.from("users").select("id, display_name, email").in("role", ["instructor", "administrator"]).order("email").then((r) => r.data ?? []),
  ]);

  const fields: FieldDef[] = [
    { name: "course_id", label: "Course", type: "select", required: true, options: courses.map((c) => ({ value: c.id, label: `${c.course_code} — ${c.title}` })) },
    { name: "academic_term_id", label: "Term", type: "select", required: true, options: terms.map((t) => ({ value: t.id, label: `${t.school_year} ${t.semester}` })) },
    { name: "instructor_id", label: "Instructor", type: "select", options: instructors.map((u) => ({ value: u.id, label: u.display_name ?? u.email })) },
    { name: "section", label: "Section", type: "text", required: true },
    { name: "schedule", label: "Schedule", type: "text", hint: "e.g. MWF 07:00-08:00" },
    { name: "capacity", label: "Capacity", type: "number" },
    { name: "status", label: "Status", type: "select", options: ["open", "closed", "cancelled"].map((s) => ({ value: s, label: s })) },
  ];

  return (
    <div>
      <PageHeader
        title="Course offerings"
        description={`${total} record${total === 1 ? "" : "s"} · Sections per term`}
        action={
          editable && (
            <CreateDialog label="New offering" title="New course offering" description="Open a section for a term.">
              <EntityForm action_url="/api/v1/course-offerings" method="POST" fields={fields} submit_label="Save offering" />
            </CreateDialog>
          )
        }
      />

      <div className="mt-6">
        <FilterBar clear_href="/course-offerings">
          <input name="search" defaultValue={q.search ?? ""} placeholder="Search section…" className={`${filter_input_cls} w-44`} />
          <select name="academic_term_id" defaultValue={q.filters.academic_term_id ?? ""} className={filter_input_cls}>
            <option value="">All terms</option>
            {terms.map((t) => (
              <option key={t.id} value={t.id}>{t.school_year} {t.semester}</option>
            ))}
          </select>
          <select name="status" defaultValue={q.filters.status ?? ""} className={filter_input_cls}>
            <option value="">All statuses</option>
            {["open", "closed", "cancelled"].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={Layers} title="No offerings found" description="Open a new section to get started." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((r) => {
            const c = r.courses as Record<string, unknown> | null;
            const t = r.academic_terms as Record<string, unknown> | null;
            return (
              <a
                key={String(r.id)}
                href={`/course-offerings/${String(r.id)}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="rounded-xl bg-indigo-600 px-3 py-1.5 font-mono text-xs font-semibold text-white">
                    {String(c?.course_code ?? "—")} · {String(r.section)}
                  </span>
                  <Badge value={String(r.status)} />
                </div>
                <p className="mt-3 font-semibold tracking-tight text-zinc-900">{String(c?.title ?? "Untitled course")}</p>
                <div className="mt-2 space-y-1 text-[13px] text-zinc-500">
                  <p>{t ? `${String(t.school_year)} · ${String(t.semester)}` : "No term assigned"}</p>
                  <p className="flex items-center gap-1.5">
                    <Clock size={13} /> {r.schedule ? String(r.schedule) : "No schedule yet"}
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Users size={13} /> Capacity {r.capacity != null ? String(r.capacity) : "—"}
                  </p>
                </div>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
                  View section <ChevronRight size={15} />
                </span>
              </a>
            );
          })}
        </div>
      )}

      <Pagination
        page={q.page}
        last_page={last_page}
        prev_href={q.page > 1 ? page_href("/course-offerings", sp, q.page - 1) : null}
        next_href={q.page < last_page ? page_href("/course-offerings", sp, q.page + 1) : null}
      />
    </div>
  );
}
