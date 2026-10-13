import { GraduationCap } from "lucide-react";

const links = [
 { href: "#features", label: "Features" },
 { href: "#roles", label: "Roles" },
 { href: "#docs", label: "API Docs" },
];

export default function Header() {
 return (
 <header className="sticky top-0 z-10 border-b border-zinc-200/70 bg-white/80 backdrop-blur">
 <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
 <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
 <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
 <GraduationCap size={18} />
 </span>
 SIMS
 </a>
 <nav className="hidden items-center gap-8 text-sm text-zinc-600 sm:flex">
 {links.map((l) => (
 <a key={l.href} href={l.href} className="transition-colors hover:text-zinc-950">
 {l.label}
 </a>
 ))}
 </nav>
 <a
 href="/login"
 className="inline-flex h-9 items-center rounded-full bg-zinc-950 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
 >
 Sign in
 </a>
 </div>
 </header>
 );
}
