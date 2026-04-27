export default function KnowledgeLoading() {
  return (
    <main className="grid gap-6">
      <div className="h-40 animate-pulse rounded-lg border border-border bg-raised" />
      <div className="h-24 animate-pulse rounded-lg border border-border bg-raised" />
      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <div className="grid gap-4">
          <div className="h-96 animate-pulse rounded-lg border border-border bg-raised" />
          <div className="h-40 animate-pulse rounded-lg border border-border bg-raised" />
        </div>
        <div className="grid gap-6">
          <div className="h-24 animate-pulse rounded-lg border border-border bg-raised" />
          <div className="h-[560px] animate-pulse rounded-lg border border-border bg-raised" />
          <div className="h-80 animate-pulse rounded-lg border border-border bg-raised" />
        </div>
      </div>
    </main>
  );
}
