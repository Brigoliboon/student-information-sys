import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { courses_repo } from "@/lib/supabase/tables/catalog";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "courses")) redirect("/dashboard");
  const { id } = await params;
  const { data } = await courses_repo().get_by_id(id);
  if (!data) notFound();
  const r = data as Record<string, unknown>;
  const editable = can_write(profile, "courses");

  return (
    <div className="max-w-3xl">
      <PageHeader
        back_href="/courses"
        back_label="Courses"
        title={String(r.title)}
        description={`${String(r.course_code)} · ${String(r.units)} units`}
        action={
          editable && (
            <EditDialog title="Edit course" description="Update course details.">
              <EntityForm
                action_url={`/api/v1/courses/${id}`}
                method="PATCH"
                submit_label="Save changes"
                initial={{ course_code: String(r.course_code), title: String(r.title), units: String(r.units), description: String(r.description ?? ""), status: String(r.status) }}
                fields={[
                  { name: "course_code", label: "Course code", type: "text", required: true },
                  { name: "title", label: "Title", type: "text", required: true },
                  { name: "units", label: "Units", type: "number", required: true },
                  { name: "description", label: "Description", type: "textarea" },
                  { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }] },
                ]}
              />
            </EditDialog>
          )
        }
      />

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
            <BookOpen size={24} />
          </span>
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-zinc-400">
              {String(r.course_code)} · {String(r.units)} units
            </p>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">{String(r.title)}</p>
          </div>
          <span className="ml-auto">
            <Badge value={String(r.status)} />
          </span>
        </div>
        {typeof r.description === "string" && r.description !== "" && (
          <p className="mt-4 text-sm leading-6 text-zinc-600">{r.description}</p>
        )}
        <div className="mt-5 flex gap-2">
          <Link href="/course-offerings" className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">
            View offerings
          </Link>
          <Link href="/courses" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            All courses
          </Link>
        </div>
      </Card>
    </div>
  );
}
