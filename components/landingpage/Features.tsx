import { Users, BookOpenCheck, ClipboardList, ShieldCheck } from "lucide-react";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const features = [
 {
 icon: Users,
 title: "Student profiles",
 description: "Searchable records with program, year level, status, and contact info — validated server-side.",
 },
 {
 icon: BookOpenCheck,
 title: "Enrollments & grades",
 description: "Duplicate-safe enrollments with one grade row per enrollment, grouped by academic term.",
 },
 {
 icon: ClipboardList,
 title: "Academic records",
 description: "Per-student records aggregated by term with unit totals, ready for registrars.",
 },
 {
 icon: ShieldCheck,
 title: "Role-based access",
 description: "Administrators, registrars, instructors, and students each see exactly what they should.",
 },
];

export default function Features() {
 return (
 <section id="features" className="border-t border-zinc-200 py-20">
 <Container>
 <SectionHeading
 eyebrow="Features"
 title="Everything academic records need"
 description="Four focused modules cover the full lifecycle from admission to final grades."
 />
 <div className="mt-10 grid gap-5 sm:grid-cols-2">
 {features.map((f) => (
 <div
 key={f.title}
 className="rounded-2xl border border-zinc-200 p-6"
 >
 <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
 <f.icon size={20} />
 </span>
 <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
 <p className="mt-2 text-sm leading-6 text-zinc-600">
 {f.description}
 </p>
 </div>
 ))}
 </div>
 </Container>
 </section>
 );
}
