import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Mail, Phone, MapPin, GraduationCap } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { get_student_by_id } from "@/lib/supabase/tables/students";
import { student_academic_record } from "@/services/academic_service";
import { can_read_student, can_write } from "@/services/rbac";
import EditStudentForm from "@/components/students/EditStudentForm";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  const { id } = await params;
  if (!can_read_student(profile, id)) redirect("/dashboard");

  const { data: student } = await get_student_by_id(id);
  if (!student) notFound();
  const s = student as Record<string, unknown>;
  const program = s.programs as Record<string, unknown> | null;
  const record = await student_academic_record(id);
  const terms = record.terms as Array<{
    term: Record<string, unknown> | null;
    records: Array<{
      enrollment_id: string;
      enrollment_status: string;
      course: Record<string, unknown> | null;
      section: unknown;
      grades: Record<string, unknown> | Record<string, unknown>[] | null;
    }>;
    total_units: number;
  }>;
  const editable = can_write(profile, "students");
  const name = `${String(s.first_name)} ${String(s.last_name)}`;

  return (
    <div className="max-w-4xl">
      <PageHeader
        back_href="/students"
        back_label="Students"
        title={name}
        description={`${String(s.student_number)} · Student profile`}
        action={
          editable && (
            <EditStudentForm
              id={id}
              initial={{
                first_name: String(s.first_name),
                last_name: String(s.last_name),
                middle_name: (s.middle_name as string) ?? null,
                email: (s.email as string) ?? null,
                year_level: (s.year_level as number) ?? null,
                status: String(s.status),
                contact_number: (s.contact_number as string) ?? null,
                address: (s.address as string) ?? null,
              }}
            />
          )
        }
      />

      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={name} size="lg" />
          <div className="min-w-0">
            <p className="text-xl font-semibold tracking-tight text-zinc-900">{name}</p>
            <p className="font-mono text-[13px] text-zinc-400">{String(s.student_number)}</p>
          </div>
          <span className="ml-auto flex gap-2">
            <Badge value={String(s.status)} />
          </span>
        </div>
        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
          <p className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200">
            <GraduationCap size={15} className="text-zinc-400" />
            <span className="truncate">{program ? `${String(program.code)} — ${String(program.name)}` : "No program"} · Year {s.year_level != null ? String(s.year_level) : "—"}</span>
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200">
            <Mail size={15} className="text-zinc-400" />
            <span className="truncate">{s.email ? String(s.email) : "No email"}</span>
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200">
            <Phone size={15} className="text-zinc-400" />
            <span className="truncate">{s.contact_number ? String(s.contact_number) : "No contact"}</span>
          </p>
          <p className="flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200">
            <MapPin size={15} className="text-zinc-400" />
            <span className="truncate">{s.address ? String(s.address) : "No address"}</span>
          </p>
        </div>
      </Card>

      <Card className="mt-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold tracking-tight text-zinc-900">Academic record</h2>
          <Link href="/enrollments" className="inline-flex h-8 items-center rounded-full border border-zinc-200 bg-white px-3 text-[13px] font-medium text-zinc-700 hover:bg-zinc-50">
            Manage enrollments
          </Link>
        </div>
        {terms.length === 0 && <p className="mt-3 text-sm text-zinc-500">No enrollments yet.</p>}
        {terms.map((t, i) => (
          <div key={i} className="mt-4 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
            <p className="text-sm font-semibold text-zinc-900">
              {t.term ? `${String(t.term.school_year)} · ${String(t.term.semester)} semester` : "Unassigned term"}
              <span className="ml-2 font-normal text-zinc-500">{t.total_units} units</span>
            </p>
            <ul className="mt-2 space-y-2">
              {t.records.map((r) => {
                const g = Array.isArray(r.grades) ? r.grades[0] : r.grades;
                return (
                  <li key={r.enrollment_id} className="flex items-center justify-between gap-3 rounded-xl bg-white px-3 py-2.5 text-sm ring-1 ring-zinc-200">
                    <span className="min-w-0">
                      <span className="font-mono text-[13px] font-medium">{String(r.course?.course_code ?? "—")}</span>
                      {" · "}{String(r.course?.title ?? "—")}
                      <span className="text-zinc-400"> ({String(r.section ?? "")})</span>
                    </span>
                    <span className="shrink-0">
                      {g ? (
                        <Badge value={String((g as Record<string, unknown>).remarks ?? r.enrollment_status)} />
                      ) : (
                        <Badge value={String(r.enrollment_status)} />
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </Card>
    </div>
  );
}
