interface SectionHeadingProps {
 eyebrow: string;
 title: string;
 description?: string;
}

export default function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
 return (
 <div className="max-w-2xl">
 <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">
 {eyebrow}
 </p>
 <h2 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h2>
 {description && (
 <p className="mt-3 text-base leading-7 text-zinc-600">{description}</p>
 )}
 </div>
 );
}
