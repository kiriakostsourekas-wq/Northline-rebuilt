import { AlertTriangle, CheckCircle2 } from "lucide-react";

export function SetupWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) {
    return (
      <div className="rounded-lg border border-teal/20 bg-teal-soft p-4">
        <div className="flex gap-3">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 text-teal-strong" />
          <div>
            <p className="text-body-sm font-black text-ink">
              Published knowledge covers the critical setup areas.
            </p>
            <p className="mt-1 text-caption font-bold text-muted">
              The assistant context bundle can be generated from approved data.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-amber/25 bg-amber-soft p-4">
      <div className="flex gap-3">
        <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 text-amber" />
        <div>
          <p className="text-body-sm font-black text-ink">
            Missing setup information
          </p>
          <ul className="mt-2 grid gap-1 text-caption font-bold leading-5 text-muted">
            {warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
