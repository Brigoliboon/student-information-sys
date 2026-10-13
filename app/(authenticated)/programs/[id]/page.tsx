import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Library } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { programs_repo } from "@/lib/supabase/tables/catalog";
import { can_list, can_write } from "@/services/rbac";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function ProgramDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (!can_list(profile, "programs")) redirect("/dashboard");
  const { id } = await params;
  const { data } = await programs_repo().get_by_id(id);
  if (!data) notFound();
  const r = data as Record<string, unknown>;
  const editable = can_write(profile, "programs");

  return (
    <div className="max-w-3xl">
      <PageHeader
        back_href="/programs"
        back_label="Programs"
        title={String(r.name)}
        description={`${String(r.code)} · Program details`}
        action={
          editable && (
            <EditDialog title="Edit program" description="Update program details.">
              <EntityForm
                action_url={`/api/v1/programs/${id}`}
                method="PATCH"
                submit_label="Save changes"
                initial={{ code: String(r.code), name: String(r.name), description: String(r.description ?? ""), status: String(r.status) }}
                fields={[
                  { name: "code", label: "Code", type: "text", required: true },
                  { name: "name", label: "Name", type: "text", required: true },
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
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <Library size={24} />
          </span>
          <div>
            <p className="font-mono text-xs font-medium uppercase tracking-widest text-zinc-400">{String(r.code)}</p>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">{String(r.name)}</p>
          </div>
          <span className="ml-auto">
            <Badge value={String(r.status)} />
          </span>
        </div>
        {typeof r.description === "string" && r.description !== "" && (
          <p className="mt-4 text-sm leading-6 text-zinc-600">{r.description}</p>
        )}
        <div className="mt-5 flex gap-2">
          <Link href="/students" className="inline-flex h-9 items-center rounded-full bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-700">
            View students
          </Link>
          <Link href="/programs" className="inline-flex h-9 items-center rounded-full border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            All programs
          </Link>
        </div>
      </Card>
    </div>
  );
}
