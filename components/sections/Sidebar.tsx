"use client";

import { usePathname } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  Library,
  CalendarDays,
  Layers,
  ClipboardList,
  Award,
  Settings,
} from "lucide-react";
import type { user_row } from "@/lib/supabase/models";
import LogoutButton from "@/components/auth/LogoutButton";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles: Array<user_row["role"]>;
}

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["administrator", "registrar", "instructor", "student"] },
  { href: "/students", label: "Students", icon: Users, roles: ["administrator", "registrar", "instructor"] },
  { href: "/programs", label: "Programs", icon: Library, roles: ["administrator", "registrar", "instructor"] },
  { href: "/courses", label: "Courses", icon: BookOpen, roles: ["administrator", "registrar", "instructor"] },
  { href: "/academic-terms", label: "Terms", icon: CalendarDays, roles: ["administrator", "registrar", "instructor"] },
  { href: "/course-offerings", label: "Offerings", icon: Layers, roles: ["administrator", "registrar", "instructor"] },
  { href: "/enrollments", label: "Enrollments", icon: ClipboardList, roles: ["administrator", "registrar", "instructor"] },
  { href: "/grades", label: "Grades", icon: Award, roles: ["administrator", "registrar", "instructor"] },
  { href: "/users", label: "Users", icon: Settings, roles: ["administrator"] },
];

export default function Sidebar({ profile }: { profile: user_row }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => n.roles.includes(profile.role));
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-zinc-200 bg-white sticky top-0">
      <a href="/dashboard" className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <GraduationCap size={19} />
        </span>
        <span className="leading-tight">
          <span className="block font-semibold tracking-tight text-zinc-900">SIMS</span>
          <span className="block text-[11px] font-medium uppercase tracking-widest text-zinc-400">
            Student portal
          </span>
        </span>
      </a>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {profile.role === "student" && profile.student_id && (
          <a
            href={`/students/${profile.student_id}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
              pathname.startsWith("/students")
                ? "bg-indigo-600 font-medium text-white shadow-sm"
                : "text-zinc-600 hover:bg-zinc-100"
            }`}
          >
            <Users size={17} />
            My Record
          </a>
        )}
        {items.map((n) => {
          const is_active =
            n.href === "/dashboard" ? pathname === n.href : pathname.startsWith(n.href);
          return (
            <a
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                is_active
                  ? "bg-indigo-600 font-medium text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              <n.icon size={17} />
              {n.label}
            </a>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3">
        <div className="flex items-center gap-3 rounded-xl bg-zinc-50 px-3 py-2.5 ring-1 ring-zinc-200">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
            {(profile.display_name ?? profile.email)?.[0]?.toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-900">
              {profile.display_name ?? profile.email}
            </p>
            <p className="text-xs capitalize text-zinc-500">{profile.role}</p>
          </div>
        </div>
        <div className="mt-2">
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}
