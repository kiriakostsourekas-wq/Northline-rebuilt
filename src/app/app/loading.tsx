export default function AppLoading() {
  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="h-6 w-40 animate-pulse rounded-md bg-subtle" />
        <div className="mt-5 h-10 w-full max-w-2xl animate-pulse rounded-md bg-subtle" />
        <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded-md bg-subtle" />
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="h-44 animate-pulse rounded-lg border border-border bg-raised" />
        <div className="h-44 animate-pulse rounded-lg border border-border bg-raised" />
        <div className="h-44 animate-pulse rounded-lg border border-border bg-raised" />
      </section>
      <section className="h-96 animate-pulse rounded-lg border border-border bg-raised" />
    </main>
  );
}
