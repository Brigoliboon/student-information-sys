"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

const stats = [
 { value: "8", label: "Domain modules" },
 { value: "24", label: "API endpoints" },
 { value: "4", label: "User roles" },
];

export default function Hero() {
 return (
 <section className="py-24 sm:py-32">
 <Container>
 <motion.div
 initial={{ opacity: 0, y: 16 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, ease: "easeOut" }}
 className="max-w-3xl"
 >
 <p className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700">
 Academic records, minus the paperwork
 </p>
 <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
 Student information, clearly organized.
 </h1>
 <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
 SIMS manages students, programs, courses, enrollments, and grades
 through a secure role-based API — one source of truth for
 administrators, registrars, instructors, and students.
 </p>
 <div className="mt-8 flex flex-col gap-3 sm:flex-row">
 <Button href="/login">Sign in</Button>
 <Button href="#docs" variant="ghost">
 Explore the API
 </Button>
 </div>
 <dl className="mt-12 flex gap-10">
 {stats.map((s) => (
 <div key={s.label}>
 <dt className="sr-only">{s.label}</dt>
 <dd className="text-3xl font-semibold tracking-tight">{s.value}</dd>
 <dd className="mt-1 text-sm text-zinc-500">{s.label}</dd>
 </div>
 ))}
 </dl>
 </motion.div>
 </Container>
 </section>
 );
}
