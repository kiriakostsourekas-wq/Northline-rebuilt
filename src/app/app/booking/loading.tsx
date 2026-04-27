export default function BookingLoading() {
  return (
    <main className="grid gap-6">
      <section className="rounded-lg border border-border bg-raised p-6 shadow-card">
        <div className="h-6 w-40 rounded-md bg-subtle" />
        <div className="mt-5 h-10 w-full max-w-2xl rounded-md bg-subtle" />
        <div className="mt-3 h-5 w-full max-w-xl rounded-md bg-subtle" />
      </section>
      <section className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid gap-6">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="min-h-56 rounded-lg border border-border bg-raised p-5 shadow-card"
            >
              <div className="h-5 w-48 rounded-md bg-subtle" />
              <div className="mt-6 grid gap-3">
                <div className="h-10 rounded-md bg-subtle" />
                <div className="h-10 rounded-md bg-subtle" />
                <div className="h-10 rounded-md bg-subtle" />
              </div>
            </div>
          ))}
        </div>
        <div className="min-h-96 rounded-lg border border-border bg-raised p-5 shadow-card">
          <div className="h-5 w-40 rounded-md bg-subtle" />
          <div className="mt-6 grid gap-3">
            <div className="h-16 rounded-md bg-subtle" />
            <div className="h-16 rounded-md bg-subtle" />
            <div className="h-16 rounded-md bg-subtle" />
          </div>
        </div>
      </section>
    </main>
  );
}
