import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Layers, ClipboardList, Award, ArrowRight, Plus } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { create_admin_client } from "@/lib/supabase/admin";
import { student_academic_record } from "@/services/academic_service";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";

const count_of = async (table: string) => {
  const admin = create_admin_client();
  const { count } = await admin.from(table).select("id", { count: "exact", head: true });
  return count ?? 0;
};

export default async function DashboardPage() {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");

  if (profile.role === "student") {
    if (!profile.student_id) {
      return (
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Your account is not linked to a student record yet. Contact the registrar.
          </p>
        </div>
      );
    }
    const record = await student_academic_record(profile.student_id);
    const student = record.student as Record<string, unknown>;
    const terms = record.terms as Array<{ total_units: number; records: unknown[] }>;
    const total_units = terms.reduce((s, t) => s + t.total_units, 0);
    const total_rows = terms.reduce((s, t) => s + t.records.length, 0);
    const name = `${String(student.first_name)} ${String(student.last_name)}`;
    return (
      <div>
        <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white border-0">
          <Avatar name={name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-widest text-indigo-200">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">{name}</h1>
            <p className="mt-1 text-sm text-indigo-100">
              {String(student.student_number)} · Year {String(student.year_level ?? "—")}
            </p>
          </div>
          <Link
            href={`/students/${profile.student_id}`}
            className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            My record <ArrowRight size={15} />
          </Link>
        </Card>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            { label: "Enrolled courses", value: total_rows },
            { label: "Terms covered", value: terms.length },
            { label: "Total units", value: total_units },
          ].map((c) => (
            <Card key={c.label} className="p-5">
              <p className="text-3xl font-semibold tracking-tight text-zinc-900">{c.value}</p>
              <p className="mt-1 text-sm text-zinc-500">{c.label}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const [students, offerings, enrollments, grades] = await Promise.all([
    count_of("students"),
    count_of("course_offerings"),
    count_of("enrollments"),
    count_of("grades"),
  ]);
  const cards = [
    { label: "Students", value: students, href: "/students", icon: Users, tint: "bg-indigo-50 text-indigo-600", cta: "Browse roster" },
    { label: "Course offerings", value: offerings, href: "/course-offerings", icon: Layers, tint: "bg-sky-50 text-sky-700", cta: "View sections" },
    { label: "Enrollments", value: enrollments, href: "/enrollments", icon: ClipboardList, tint: "bg-emerald-50 text-emerald-700", cta: "Manage enrollments" },
    { label: "Grades recorded", value: grades, href: "/grades", icon: Award, tint: "bg-amber-50 text-amber-700", cta: "Review grades" },
  ];
  return (
    <div>
      <Card className="flex flex-wrap items-center gap-4 bg-gradient-to-br from-indigo-600 to-violet-600 p-6 text-white border-0">
        <div className="min-w-0 flex-1">
          <p className="inline-flex"><Badge value={String(profile.role)} /></p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Good day, {profile.display_name ?? "Registrar"}.</h1>
          <p className="mt-1 text-sm text-indigo-100">
            {students} students · {offerings} sections · {enrollments} enrollments. Everything at a glance.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/students" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-white px-5 text-sm font-medium text-indigo-700 hover:bg-indigo-50">
            <Plus size={15} /> New student
          </Link>
          <Link href="/course-offerings" className="inline-flex h-10 items-center rounded-full px-5 text-sm font-medium text-white ring-1 ring-white/40 hover:bg-white/10">
            Offerings
          </Link>
        </div>
      </Card>

      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="group rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md"
          >
            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${c.tint}`}>
              <c.icon size={19} />
            </span>
            <p className="mt-3 text-3xl font-semibold tracking-tight text-zinc-900">{c.value}</p>
            <p className="mt-1 text-sm text-zinc-500">{c.label}</p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
              {c.cta} <ArrowRight size={14} />
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="font-semibold tracking-tight text-zinc-900">Quick actions</h2>
          <p className="mt-1 text-sm text-zinc-500">Jump to the most common registrar tasks.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/students" className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">Students</Link>
            <Link href="/programs" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Programs</Link>
            <Link href="/courses" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Courses</Link>
            <Link href="/enrollments" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Enroll</Link>
            <Link href="/grades" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Grades</Link>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold tracking-tight text-zinc-900">Navigate</h2>
          <p className="mt-1 text-sm text-zinc-500">Every module is now card-based — no dense tables.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              { href: "/academic-terms", label: "Academic terms" },
              { href: "/users", label: "Users & roles" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 ring-1 ring-zinc-200 hover:ring-indigo-200">
                {l.label} <ArrowRight size={14} className="text-zinc-400" />
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
