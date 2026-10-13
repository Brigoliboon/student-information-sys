import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import Avatar from "@/components/ui/Avatar";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function OfferingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "offerings")) redirect("/dashboard");
  const { id } = await params;
  const admin = create_admin_client();
  const { data } = await admin
    .from("course_offerings")
    .select("*, courses(*), academic_terms(*)")
    .eq("id", id)
    .maybeSingle();
  if (!data) notFound();
  const r = data as Record<string, unknown>;
  const course = r.courses as Record<string, unknown> | null;
  const term = r.academic_terms as Record<string, unknown> | null;
  const editable = can_write(profile, "offerings");

  const { data: roster } = await admin
    .from("enrollments")
    .select("id, status, students(id, student_number, first_name, last_name)")
    .eq("course_offering_id", id)
    .order("created_at");

  return (
    <div className="max-w-4xl">
      <PageHeader
        back_href="/course-offerings"
        back_label="Offerings"
        title={`${String(course?.course_code ?? "—")} · ${String(r.section)}`}
        description={`${String(course?.title ?? "")} · ${term ? `${String(term.school_year)} ${String(term.semester)}` : "No term"}`}
        action={
          editable && (
            <EditDialog title="Edit offering" description="Update section, schedule, capacity and status.">
              <EntityForm
                action_url={`/api/v1/course-offerings/${id}`}
                method="PATCH"
                submit_label="Save changes"
                initial={{ section: String(r.section), schedule: String(r.schedule ?? ""), capacity: String(r.capacity), status: String(r.status) }}
                fields={[
                  { name: "section", label: "Section", type: "text", required: true },
                  { name: "schedule", label: "Schedule", type: "text" },
                  { name: "capacity", label: "Capacity", type: "number" },
                  { name: "status", label: "Status", type: "select", options: ["open", "closed", "cancelled"].map((s) => ({ value: s, label: s })) },
                ]}
              />
            </EditDialog>
          )
        }
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            <Clock size={13} /> Schedule
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">{typeof r.schedule === "string" && r.schedule !== "" ? r.schedule : "No schedule yet"}</p>
        </Card>
        <Card className="p-5">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            <Users size={13} /> Capacity
          </p>
          <p className="mt-2 text-sm font-medium text-zinc-900">
            {String(roster?.length ?? 0)} enrolled / {r.capacity != null ? String(r.capacity) : "—"} seats
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Status</p>
          <p className="mt-2"><Badge value={String(r.status)} /></p>
        </Card>
      </div>

      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold tracking-tight text-zinc-900">Class roster ({roster?.length ?? 0})</h2>
          <Link href="/enrollments" className="inline-flex h-8 items-center rounded-full bg-zinc-900 px-3 text-[13px] font-medium text-white hover:bg-zinc-700">
            Enroll student
          </Link>
        </div>
        {(roster ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">Nobody enrolled yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {(roster ?? []).map((e) => {
              const s = e.students as unknown as Record<string, unknown> | null;
              const name = `${String(s?.first_name ?? "")} ${String(s?.last_name ?? "")}`.trim();
              return (
                <li key={e.id}>
                  <Link
                    href={`/students/${String(s?.id)}`}
                    className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200 hover:ring-indigo-200"
                  >
                    <Avatar name={name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-900">{name}</span>
                      <span className="block font-mono text-xs text-zinc-400">{String(s?.student_number)}</span>
                    </span>
                    <Badge value={String(e.status)} />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
