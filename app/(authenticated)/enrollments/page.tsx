import { redirect } from "next/navigation";
import { ClipboardList, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { filter_input_cls } from "@/components/ui/FilterBar";
import EntityForm, { type FieldDef } from "@/components/crud/EntityForm";
import CreateDialog from "@/components/crud/CreateDialog";
import { parse_page_params, page_href, card_grid } from "@/components/crud/list_helpers";

export default async function EnrollmentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "enrollments")) {
    redirect(profile.student_id ? `/students/${profile.student_id}` : "/dashboard");
  }

  const sp = await searchParams;
  const q = parse_page_params(sp);
  const admin = create_admin_client();

  let query = admin
    .from("enrollments")
    .select("*, students(id, student_number, first_name, last_name), course_offerings(id, section, courses(course_code))", { count: "exact" });
  if (profile.role === "instructor") {
    const { data: mine } = await admin.from("course_offerings").select("id").eq("instructor_id", profile.id);
    query = query.in("course_offering_id", (mine ?? []).map((o) => o.id));
  }
  for (const [k, v] of Object.entries(q.filters)) {
    if (["student_id", "course_offering_id", "status"].includes(k)) query = query.eq(k, v);
  }
  const [col, dir] = (q.sort ?? "created_at:desc").split(":");
  const { data, count } = await query.order(col, { ascending: (dir ?? "desc") !== "desc" }).range((q.page - 1) * q.per_page, q.page * q.per_page - 1);
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const total = count ?? 0;
  const last_page = Math.max(1, Math.ceil(total / q.per_page));
  const editable = can_write(profile, "enrollments");

  const [students, offerings] = await Promise.all([
    admin.from("students").select("id, student_number, first_name, last_name").order("student_number").limit(200).then((r) => r.data ?? []),
    admin.from("course_offerings").select("id, section, courses(course_code)").eq("status", "open").limit(100).then((r) => r.data ?? []),
  ]);

  const fields: FieldDef[] = [
    { name: "student_id", label: "Student", type: "select", required: true, options: students.map((s) => ({ value: s.id, label: `${s.student_number} — ${s.first_name} ${s.last_name}` })) },
    { name: "course_offering_id", label: "Offering", type: "select", required: true, options: offerings.map((o) => ({ value: o.id, label: `${((o.courses as unknown) as { course_code: string } | null)?.course_code ?? "?"} · ${o.section}` })) },
  ];

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description={`${total} record${total === 1 ? "" : "s"} · Student ↔ section links`}
        action={
          editable && (
            <CreateDialog label="Enroll student" title="Enroll a student" description="Pick a student and an open section.">
              <EntityForm action_url="/api/v1/enrollments" method="POST" fields={fields} submit_label="Enroll" />
            </CreateDialog>
          )
        }
      />

      <div className="mt-6">
        <FilterBar clear_href="/enrollments">
          <select name="status" defaultValue={q.filters.status ?? ""} className={filter_input_cls}>
            <option value="">All statuses</option>
            {["enrolled", "dropped", "withdrawn", "completed"].map((s) => (
              <option key={s} value={s} className="capitalize">{s}</option>
            ))}
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={ClipboardList} title="No enrollments found" description="Enroll a student into an open section." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((r) => {
            const s = r.students as Record<string, unknown> | null;
            const o = r.course_offerings as Record<string, unknown> | null;
            const c = o?.courses as Record<string, unknown> | null;
            const name = `${String(s?.first_name ?? "")} ${String(s?.last_name ?? "")}`.trim() || "Unknown student";
            return (
              <a
                key={String(r.id)}
                href={`/enrollments/${String(r.id)}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold tracking-tight text-zinc-900">{name}</p>
                    <p className="font-mono text-xs text-zinc-400">{String(s?.student_number ?? "—")}</p>
                  </div>
                  <Badge value={String(r.status)} />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200">
                  <span className="font-mono text-[13px] font-medium text-zinc-700">
                    {String(c?.course_code ?? "—")} · {String(o?.section ?? "")}
                  </span>
                  <ChevronRight size={15} className="text-zinc-400 group-hover:text-indigo-600" />
                </div>
              </a>
            );
          })}
        </div>
      )}

      <Pagination
        page={q.page}
        last_page={last_page}
        prev_href={q.page > 1 ? page_href("/enrollments", sp, q.page - 1) : null}
        next_href={q.page < last_page ? page_href("/enrollments", sp, q.page + 1) : null}
      />
    </div>
  );
}
