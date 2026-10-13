import { redirect } from "next/navigation";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { get_session_profile } from "@/lib/supabase/session";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const profile = await get_session_profile();
  if (profile) redirect("/dashboard");

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-md flex-col justify-center px-6 py-16">
      <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-zinc-900">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
          <GraduationCap size={19} />
        </span>
        SIMS
      </Link>
      <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Welcome back</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sign in with your school account to continue.
        </p>
        <LoginForm />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        Demo accounts use the `@example.edu` addresses from the README.
      </p>
    </div>
  );
}
