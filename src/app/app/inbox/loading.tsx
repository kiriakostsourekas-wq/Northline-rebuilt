export default function InboxLoading() {
  return (
    <main className="grid gap-6">
      <div className="h-36 animate-pulse rounded-lg border border-border bg-raised" />
      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <div className="grid gap-3">
          <div className="h-28 animate-pulse rounded-lg border border-border bg-raised" />
          <div className="h-28 animate-pulse rounded-lg border border-border bg-raised" />
          <div className="h-72 animate-pulse rounded-lg border border-border bg-raised" />
        </div>
        <div className="h-[620px] animate-pulse rounded-lg border border-border bg-raised" />
      </div>
    </main>
  );
}
