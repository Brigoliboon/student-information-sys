import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { terms_repo } from "@/lib/supabase/tables/catalog";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function TermDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "terms")) redirect("/dashboard");
  const { id } = await params;
  const { data } = await terms_repo().get_by_id(id);
  if (!data) notFound();
  const r = data as Record<string, unknown>;
  const editable = can_write(profile, "terms");

  return (
    <div className="max-w-3xl">
      <PageHeader
        back_href="/academic-terms"
        back_label="Terms"
        title={`${String(r.school_year)} · ${String(r.semester)}`}
        description="Academic term details"
        action={
          editable && (
            <EditDialog title="Edit term" description="Update term dates and status.">
              <EntityForm
                action_url={`/api/v1/academic-terms/${id}`}
                method="PATCH"
                submit_label="Save changes"
                initial={{ school_year: String(r.school_year), semester: String(r.semester), start_date: String(r.start_date ?? ""), end_date: String(r.end_date ?? ""), status: String(r.status) }}
                fields={[
                  { name: "school_year", label: "School year", type: "text", required: true },
                  { name: "semester", label: "Semester", type: "select", required: true, options: ["1st", "2nd", "summer"].map((s) => ({ value: s, label: s })) },
                  { name: "start_date", label: "Start date", type: "date" },
                  { name: "end_date", label: "End date", type: "date" },
                  { name: "status", label: "Status", type: "select", options: ["upcoming", "ongoing", "closed"].map((s) => ({ value: s, label: s })) },
                ]}
              />
            </EditDialog>
          )
        }
      />

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
            <CalendarDays size={24} />
          </span>
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">
              {String(r.school_year)} · <span className="capitalize">{String(r.semester)}</span>
            </p>
            <p className="text-sm text-zinc-500">
              {r.start_date ? String(r.start_date) : "—"} → {r.end_date ? String(r.end_date) : "—"}
            </p>
          </div>
          <span className="ml-auto">
            <Badge value={String(r.status)} />
          </span>
        </div>
        <div className="mt-5 flex gap-2">
          <Link href="/course-offerings" className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">
            View offerings
          </Link>
          <Link href="/academic-terms" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            All terms
          </Link>
        </div>
      </Card>
    </div>
  );
}
