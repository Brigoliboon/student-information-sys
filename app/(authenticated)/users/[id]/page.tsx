import { redirect, notFound } from "next/navigation";
import { get_session_profile } from "@/lib/supabase/session";
import { get_user_by_id } from "@/lib/supabase/tables/users";
import PageHeader from "@/components/ui/PageHeader";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import Card from "@/components/ui/Card";
import EntityForm from "@/components/crud/EntityForm";
import EditDialog from "@/components/crud/EditDialog";

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (profile.role !== "administrator") redirect("/dashboard");
  const { id } = await params;
  const { data } = await get_user_by_id(id);
  if (!data) notFound();
  const r = data as Record<string, unknown>;

  return (
    <div className="max-w-3xl">
      <PageHeader
        back_href="/users"
        back_label="Users"
        title={String(r.display_name ?? r.email)}
        description="User account and role"
        action={
          <EditDialog title="Edit user" description="Update role and status.">
            <EntityForm
              action_url={`/api/v1/users/${id}`}
              method="PATCH"
              submit_label="Save changes"
              initial={{ display_name: String(r.display_name ?? ""), role: String(r.role), status: String(r.status) }}
              fields={[
                { name: "display_name", label: "Display name", type: "text" },
                { name: "role", label: "Role", type: "select", required: true, options: ["administrator", "registrar", "instructor", "student"].map((x) => ({ value: x, label: x })) },
                { name: "status", label: "Status", type: "select", required: true, options: ["active", "inactive", "suspended"].map((x) => ({ value: x, label: x })) },
              ]}
            />
          </EditDialog>
        }
      />

      <Card className="mt-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={String(r.display_name ?? r.email)} size="lg" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-zinc-900">{String(r.display_name ?? r.email)}</p>
            <p className="font-mono text-[13px] text-zinc-400">{String(r.email)}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Badge value={String(r.role)} />
          <Badge value={String(r.status)} />
        </div>
      </Card>
    </div>
  );
}
