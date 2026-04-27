"use client";

export default function BookingError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="rounded-lg border border-rose/25 bg-rose-soft p-6 text-rose">
      <p className="text-caption font-black uppercase">Booking error</p>
      <h1 className="mt-3 text-title-sm font-black">
        Booking settings could not load
      </h1>
      <p className="mt-2 max-w-xl text-body-sm leading-6">
        {error.message || "Refresh the route and try again."}
      </p>
      <button
        onClick={reset}
        className="mt-5 inline-flex min-h-10 items-center justify-center rounded-md bg-rose px-4 py-2 text-caption font-black text-white"
      >
        Retry
      </button>
    </main>
  );
}
