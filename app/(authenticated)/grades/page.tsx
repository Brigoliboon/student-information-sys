import { redirect } from "next/navigation";
import { Award, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import EntityForm, { type FieldDef } from "@/components/crud/EntityForm";
import CreateDialog from "@/components/crud/CreateDialog";
import { card_grid } from "@/components/crud/list_helpers";

export default async function GradesPage() {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "grades")) {
    redirect(profile.student_id ? `/students/${profile.student_id}` : "/dashboard");
  }
  const admin = create_admin_client();

  let enrollment_ids: string[] | null = null;
  if (profile.role === "instructor") {
    const { data: mine } = await admin.from("course_offerings").select("id").eq("instructor_id", profile.id);
    const { data: enr } = await admin.from("enrollments").select("id").in("course_offering_id", (mine ?? []).map((o) => o.id));
    enrollment_ids = (enr ?? []).map((e) => e.id);
  }

  let query = admin
    .from("grades")
    .select("*, enrollments(id, student_id, course_offering_id, students(student_number, first_name, last_name), course_offerings(section, courses(course_code)))")
    .order("created_at", { ascending: false })
    .limit(100);
  if (enrollment_ids) query = query.in("enrollment_id", enrollment_ids.length ? enrollment_ids : ["00000000-0000-0000-0000-000000000000"]);
  const { data } = await query;
  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const editable = can_write(profile, "grades");

  const { data: open_enrollments } = await admin
    .from("enrollments")
    .select("id, students(student_number, first_name, last_name), course_offerings!inner(id, section, instructor_id, courses(course_code))")
    .eq("course_offerings.status", "open")
    .limit(200);
  const eligible = (open_enrollments ?? []).filter((e) => {
    const o = e.course_offerings as unknown as Record<string, unknown>;
    return profile.role !== "instructor" || o?.instructor_id === profile.id;
  });

  const fields: FieldDef[] = [
    { name: "enrollment_id", label: "Enrollment", type: "select", required: true, options: eligible.map((e) => {
      const s = e.students as unknown as Record<string, unknown>;
      const o = e.course_offerings as unknown as Record<string, unknown>;
      const c = o?.courses as unknown as Record<string, unknown>;
      return { value: e.id, label: `${String(s?.student_number)} · ${String(c?.course_code)} ${String(o?.section)}` };
    }) },
    { name: "grade_value", label: "Grade (1.0–5.0)", type: "number" },
    { name: "remarks", label: "Remarks", type: "select", options: ["passed", "failed", "incomplete", "dropped", "withdrawn", "no_grade"].map((x) => ({ value: x, label: x })) },
  ];

  return (
    <div>
      <PageHeader
        title="Grades"
        description={profile.role === "instructor" ? "Your offerings only · latest 100" : "Latest 100 records · card view"}
        action={
          editable && (
            <CreateDialog label="Record grade" title="Record a grade" description="Attach a grade to an open enrollment.">
              <EntityForm action_url="/api/v1/grades" method="POST" fields={fields} submit_label="Save grade" />
            </CreateDialog>
          )
        }
      />

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={Award} title="No grades yet" description="Record the first grade for an open enrollment." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((g) => {
            const e = g.enrollments as Record<string, unknown> | null;
            const s = e?.students as Record<string, unknown> | null;
            const o = e?.course_offerings as Record<string, unknown> | null;
            const c = o?.courses as Record<string, unknown> | null;
            const name = `${String(s?.first_name ?? "")} ${String(s?.last_name ?? "")}`.trim() || "Unknown";
            return (
              <a
                key={String(g.id)}
                href={`/grades/${String(g.id)}`}
                className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{name}</p>
                    <p className="font-mono text-xs text-zinc-400">
                      {String(c?.course_code ?? "—")} {String(o?.section ?? "")}
                    </p>
                  </div>
                  <ChevronRight size={15} className="text-zinc-300 group-hover:text-indigo-600" />
                </div>
                <div className="mt-4 flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200">
                  <span className="text-2xl font-semibold tracking-tight text-zinc-900">
                    {g.grade_value != null ? String(g.grade_value) : "—"}
                  </span>
                  <Badge value={String(g.remarks)} />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
