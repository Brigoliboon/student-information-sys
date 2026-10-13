import type { ReactNode } from "react";

export default function PageHeader({
  title,
  description,
  action,
  back_href,
  back_label,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  back_href?: string;
  back_label?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        {back_href && (
          <a
            href={back_href}
            className="mb-2 inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-[13px] font-medium text-zinc-500 ring-1 ring-zinc-200 hover:text-zinc-900"
          >
            ← {back_label ?? "Back"}
          </a>
        )}
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-[28px]">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action && <div className="flex items-center gap-2">{action}</div>}
    </div>
  );
}
