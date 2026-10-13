import { FileText, Terminal } from "lucide-react";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import SectionHeading from "@/components/ui/SectionHeading";

export default function DocsCta() {
 return (
 <section id="docs" className="border-t border-zinc-200 py-20">
 <Container>
 <SectionHeading
 eyebrow="Developers"
 title="Documented, testable API"
 description="OpenAPI spec, Postman collection with success and failure examples, and a curl smoke suite ship with the repo."
 />
 <div className="mt-10 grid gap-5 md:grid-cols-2">
 <div className="rounded-2xl border border-zinc-200 p-6">
 <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
 <FileText size={20} />
 </span>
 <h3 className="mt-4 font-semibold tracking-tight">API references</h3>
 <p className="mt-2 text-sm leading-6 text-zinc-600">
 <code className="font-mono text-[13px]">docs/openapi.yaml</code> covers
 every path and schema. Import{" "}
 <code className="font-mono text-[13px]">docs/postman/sims_collection.json</code>{" "}
 with its environment to click through all 20 demo flows.
 </p>
 </div>
 <div className="rounded-2xl border border-zinc-200 p-6">
 <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/10 text-indigo-600">
 <Terminal size={20} />
 </span>
 <h3 className="mt-4 font-semibold tracking-tight">Try it in one command</h3>
 <pre className="mt-3 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-[13px] leading-6 text-zinc-100">
 {`curl -X POST $BASE/api/v1/auth/login \\
 -H 'Content-Type: application/json' \\
 -d '{"email":"admin@example.edu",
 "password":"…"}'`}
 </pre>
 <div className="mt-4">
 <Button href="/login">Sign in to start</Button>
 </div>
 </div>
 </div>
 </Container>
 </section>
 );
}
