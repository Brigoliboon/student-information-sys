import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function EnrollmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "enrollments")) redirect("/dashboard");
  const { id } = await params;
  const admin = create_admin_client();
  const { data } = await admin
    .from("enrollments")
    .select("*, students(id, student_number, first_name, last_name), course_offerings(id, section, courses(course_code, title)), grades(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as Record<string, unknown>;
  const s = r.students as Record<string, unknown> | null;
  const o = r.course_offerings as Record<string, unknown> | null;
  const c = o?.courses as Record<string, unknown> | null;
  const grades = (r.grades ?? []) as Array<Record<string, unknown>>;
  if (profile.role === "student" && s?.id !== profile.student_id) redirect("/dashboard");
  const can_patch = profile.role === "administrator" || profile.role === "registrar";
  const name = `${String(s?.first_name ?? "")} ${String(s?.last_name ?? "")}`.trim() || "Unknown";

  return (
    <div className="max-w-3xl">
      <PageHeader
        back_href="/enrollments"
        back_label="Enrollments"
        title={name}
        description={`${String(s?.student_number ?? "—")} · ${String(c?.course_code ?? "—")} ${String(o?.section ?? "")}`}
        action={
          can_patch && (
            <EditDialog title="Change status" description="Update the enrollment status.">
              <EntityForm
                action_url={`/api/v1/enrollments/${id}`}
                method="PATCH"
                submit_label="Update status"
                initial={{ status: String(r.status) }}
                fields={[
                  { name: "status", label: "Status", type: "select", required: true, options: ["enrolled", "dropped", "withdrawn", "completed"].map((x) => ({ value: x, label: x })) },
                ]}
              />
            </EditDialog>
          )
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <Avatar name={name} />
            <div>
              <p className="font-semibold tracking-tight text-zinc-900">{name}</p>
              <p className="font-mono text-xs text-zinc-400">{String(s?.student_number ?? "—")}</p>
            </div>
          </div>
          <div className="mt-4">
            <Badge value={String(r.status)} />
          </div>
          <Link href={`/students/${String(s?.id ?? "")}`} className="mt-4 inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Open student
          </Link>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Section</p>
          <p className="mt-1 font-mono text-lg font-semibold text-zinc-900">
            {String(c?.course_code ?? "—")} {String(o?.section ?? "")}
          </p>
          <p className="mt-1 text-sm text-zinc-500">{String(c?.title ?? "")}</p>
          <div className="mt-4 rounded-xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Grade</p>
            {grades.length === 0 ? (
              <p className="mt-1 text-sm text-zinc-500">
                No grade yet. <Link href="/grades" className="font-medium text-indigo-700 hover:underline">Record one →</Link>
              </p>
            ) : (
              <p className="mt-1 text-sm text-zinc-900">
                <span className="text-lg font-semibold">{String(grades[0].grade_value ?? "—")}</span>
                {" · "}
                {String(grades[0].remarks)}{" "}
                <Link href={`/grades/${String(grades[0].id)}`} className="font-medium text-indigo-700 hover:underline">Edit →</Link>
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
