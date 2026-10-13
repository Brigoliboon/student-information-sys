import { redirect } from "next/navigation";
import { Settings, ChevronRight } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import { list_users } from "@/lib/supabase/tables/users";
import PageHeader from "@/components/ui/PageHeader";
import Pagination from "@/components/ui/Pagination";
import Badge from "@/components/ui/Badge";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import FilterBar, { filter_input_cls } from "@/components/ui/FilterBar";
import EntityForm, { type FieldDef } from "@/components/crud/EntityForm";
import CreateDialog from "@/components/crud/CreateDialog";
import { parse_page_params, page_href, card_grid, card_cls } from "@/components/crud/list_helpers";

const FIELDS: FieldDef[] = [
  { name: "id", label: "Auth user ID", type: "text", required: true, hint: "The UUID from Authentication → Users in Supabase (or scripts/seed_auth_users.mjs)." },
  { name: "email", label: "Email", type: "email", required: true },
  { name: "display_name", label: "Display name", type: "text" },
  { name: "role", label: "Role", type: "select", required: true, options: ["administrator", "registrar", "instructor", "student"].map((r) => ({ value: r, label: r })) },
  { name: "status", label: "Status", type: "select", options: ["active", "inactive", "suspended"].map((s) => ({ value: s, label: s })) },
];

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");
  if (profile.role !== "administrator") redirect("/dashboard");

  const sp = await searchParams;
  const q = parse_page_params(sp);
  const { data, meta } = await list_users({ ...q, role: q.filters.role, status: q.filters.status });
  const rows = (data ?? []) as Array<Record<string, unknown>>;

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${meta.total} account${meta.total === 1 ? "" : "s"} · Roles and access`}
        action={
          <CreateDialog label="Link Auth account" title="Link Auth account" description="Create a user profile — the Auth account must exist first.">
            <EntityForm action_url="/api/v1/users" method="POST" fields={FIELDS} submit_label="Save profile" />
          </CreateDialog>
        }
      />

      <div className="mt-6">
        <FilterBar clear_href="/users">
          <input name="search" defaultValue={q.search ?? ""} placeholder="Search email or name…" className={`${filter_input_cls} w-56`} />
          <select name="role" defaultValue={q.filters.role ?? ""} className={filter_input_cls}>
            <option value="">All roles</option>
            {["administrator", "registrar", "instructor", "student"].map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
        </FilterBar>
      </div>

      {rows.length === 0 ? (
        <div className="mt-5">
          <EmptyState icon={Settings} title="No users found" description="Adjust your search or link a new Auth account." />
        </div>
      ) : (
        <div className={card_grid}>
          {rows.map((r) => (
            <a key={String(r.id)} href={`/users/${String(r.id)}`} className={card_cls}>
              <div className="flex items-center gap-3">
                <Avatar name={String(r.display_name ?? r.email)} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold tracking-tight text-zinc-900">
                    {r.display_name ? String(r.display_name) : String(r.email)}
                  </p>
                  <p className="truncate text-sm text-zinc-500">{String(r.email)}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Badge value={String(r.role)} />
                <Badge value={String(r.status)} />
              </div>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-700">
                Manage access <ChevronRight size={15} />
              </span>
            </a>
          ))}
        </div>
      )}

      <Pagination
        page={meta.page}
        last_page={meta.last_page}
        prev_href={meta.page > 1 ? page_href("/users", sp, meta.page - 1) : null}
        next_href={meta.page < meta.last_page ? page_href("/users", sp, meta.page + 1) : null}
      />
    </div>
  );
}
