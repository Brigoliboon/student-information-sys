import type { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { get_session_profile } from "@/lib/supabase/session";
import Sidebar from "@/components/sections/Sidebar";

// Authenticated shell: every page under /(authenticated) inherits this guard.
// Cookie session is revalidated per request; no session -> /login.
export default async function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const profile = await get_session_profile();
  if (!profile) redirect("/login");

  return (
    <div className="flex min-h-screen bg-[#f6f7f9] text-zinc-900">
      <div className="sticky top-0 hidden h-screen md:block">
        <div className="h-full">
          <Sidebar profile={profile} />
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur md:hidden">
          <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 text-sm">
            <Link href="/dashboard" className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium">Dashboard</Link>
            <Link href="/students" className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium">Students</Link>
            <Link href="/programs" className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium">Programs</Link>
            <Link href="/courses" className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium">Courses</Link>
            <Link href="/enrollments" className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium">Enrollments</Link>
            <Link href="/grades" className="rounded-full bg-zinc-100 px-3 py-1.5 font-medium">Grades</Link>
          </div>
        </div>
        <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
