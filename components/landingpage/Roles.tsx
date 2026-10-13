import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

const roles = [
 { name: "Administrator", access: "Full access to every resource, including user accounts." },
 { name: "Registrar", access: "Manages students, programs, courses, and enrollments." },
 { name: "Instructor", access: "Views assigned offerings and grades their own students." },
 { name: "Student", access: "Views only their own profile, grades, and records." },
];

export default function Roles() {
 return (
 <section id="roles" className="border-t border-zinc-200 py-20">
 <Container>
 <SectionHeading
 eyebrow="Roles"
 title="Access that matches responsibility"
 description="Every API route enforces both role checks and object-level ownership."
 />
 <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
 {roles.map((r, i) => (
 <li
 key={r.name}
 className="rounded-2xl border border-zinc-200 p-6"
 >
 <p className="text-xs font-semibold text-zinc-400">0{i + 1}</p>
 <h3 className="mt-2 font-semibold tracking-tight">{r.name}</h3>
 <p className="mt-2 text-sm leading-6 text-zinc-600">{r.access}</p>
 </li>
 ))}
 </ol>
 </Container>
 </section>
 );
}
