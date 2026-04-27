export default function DestinationsLoading() {
  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="h-6 w-44 rounded-md bg-subtle" />
        <div className="mt-5 h-10 w-full max-w-3xl rounded-md bg-subtle" />
        <div className="mt-3 h-5 w-full max-w-xl rounded-md bg-subtle" />
      </section>
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="grid gap-6">
          <div className="min-h-96 rounded-lg border border-border bg-raised p-5 shadow-card" />
          <div className="min-h-80 rounded-lg border border-border bg-raised p-5 shadow-card" />
        </div>
        <div className="min-h-96 rounded-lg border border-border bg-raised p-5 shadow-card" />
      </section>
    </main>
  );
}
