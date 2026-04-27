import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body: string;
};

export function EmptyState({ icon: Icon, title, body }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-border bg-raised p-6 shadow-card">
      <span className="grid size-11 place-items-center rounded-md bg-teal-soft text-teal-strong">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h2 className="mt-5 text-title-sm font-black">{title}</h2>
      <p className="mt-3 text-body-sm leading-6 text-muted">{body}</p>
    </div>
  );
}
