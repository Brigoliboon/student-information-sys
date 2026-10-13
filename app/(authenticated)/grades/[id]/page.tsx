import { redirect, notFound } from "next/navigation";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function GradeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "grades")) redirect("/dashboard");
  const { id } = await params;
  const admin = create_admin_client();
  const { data } = await admin
    .from("grades")
    .select("*, enrollments(id, student_id, course_offering_id, students(first_name, last_name, student_number))")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const g = data as Record<string, unknown>;
  const e = g.enrollments as Record<string, unknown> | null;
  const s = e?.students as Record<string, unknown> | null;
  if (profile.role === "student" && e?.student_id !== profile.student_id) redirect("/dashboard");
  const editable = can_write(profile, "grades");
  const name = `${String(s?.first_name ?? "")} ${String(s?.last_name ?? "")}`.trim() || "Unknown";

  return (
    <div className="max-w-3xl">
      <PageHeader
        back_href="/grades"
        back_label="Grades"
        title={name}
        description={`Grade record · ${String(s?.student_number ?? "—")}`}
        action={
          editable && (
            <EditDialog title="Edit grade" description="Update the grade value and remarks.">
              <EntityForm
                action_url={`/api/v1/grades/${id}`}
                method="PATCH"
                submit_label="Save changes"
                initial={{ grade_value: g.grade_value != null ? String(g.grade_value) : "", remarks: String(g.remarks) }}
                fields={[
                  { name: "grade_value", label: "Grade (1.0–5.0)", type: "number" },
                  { name: "remarks", label: "Remarks", type: "select", required: true, options: ["passed", "failed", "incomplete", "dropped", "withdrawn", "no_grade"].map((x) => ({ value: x, label: x })) },
                ]}
              />
            </EditDialog>
          )
        }
      />

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={name} size="lg" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">{name}</p>
            <p className="font-mono text-[13px] text-zinc-400">{String(s?.student_number ?? "—")}</p>
          </div>
          <span className="ml-auto">
            <Badge value={String(g.remarks)} />
          </span>
        </div>
        <div className="mt-5 flex items-center justify-between rounded-2xl bg-zinc-50 px-5 py-4 ring-1 ring-zinc-200">
          <span className="text-sm text-zinc-500">Grade value</span>
          <span className="text-3xl font-semibold tracking-tight text-zinc-900">
            {g.grade_value != null ? String(g.grade_value) : "—"}
          </span>
        </div>
        <div className="mt-4 flex gap-2">
          <a href={`/enrollments/${String(e?.id ?? "")}`} className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">
            View enrollment
          </a>
        </div>
      </Card>
    </div>
  );
}
