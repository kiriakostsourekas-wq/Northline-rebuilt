export default function DashboardLoading() {
  return (
    <main className="grid gap-6">
      <div className="h-48 animate-pulse rounded-lg border border-border bg-raised" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-lg border border-border bg-raised"
          />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-96 animate-pulse rounded-lg border border-border bg-raised" />
        <div className="h-96 animate-pulse rounded-lg border border-border bg-raised" />
      </div>
    </main>
  );
}
