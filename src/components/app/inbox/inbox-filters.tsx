import Link from "next/link";

const statuses = [
  { label: "All", value: "ALL" },
  { label: "Open", value: "OPEN" },
  { label: "Waiting on lead", value: "WAITING_ON_LEAD" },
  { label: "Waiting on team", value: "WAITING_ON_BUSINESS" },
  { label: "Closed", value: "CLOSED" },
];

export function InboxFilters({
  activeStatus,
  query,
}: {
  activeStatus: string;
  query: string;
}) {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <nav aria-label="Conversation status filters" className="flex flex-wrap gap-2">
        {statuses.map((status) => (
          <Link
            key={status.value}
            href={buildHref(status.value, query)}
            className={`rounded-md border px-3 py-2 text-caption font-black transition-colors ${
              activeStatus === status.value
                ? "border-teal/45 bg-teal-soft text-teal-strong"
                : "border-border bg-raised text-muted hover:border-teal/35 hover:text-ink"
            }`}
          >
            {status.label}
          </Link>
        ))}
      </nav>
      <form action="/app/inbox" className="flex min-w-0 gap-2">
        {activeStatus !== "ALL" ? (
          <input type="hidden" name="status" value={activeStatus} />
        ) : null}
        <input
          name="q"
          defaultValue={query}
          placeholder="Search leads or messages"
          className="min-h-10 min-w-0 flex-1 rounded-md border border-border bg-canvas px-3 text-body-sm text-ink outline-none focus:border-teal lg:w-72"
        />
        <button className="rounded-md bg-ink px-4 py-2 text-caption font-black text-white">
          Search
        </button>
      </form>
    </div>
  );
}

function buildHref(status: string, query: string) {
  const params = new URLSearchParams();
  if (status !== "ALL") params.set("status", status);
  if (query) params.set("q", query);
  const suffix = params.toString();
  return suffix ? `/app/inbox?${suffix}` : "/app/inbox";
}
