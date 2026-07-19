const TOUR_HREF = "/tours/tour-01";

export function ClosingCta() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-primary px-6 py-14 text-center sm:px-12">
        <h2 className="text-balance text-3xl font-black tracking-tight text-primary-foreground sm:text-4xl">
          Ready to see Rotterdam differently?
        </h2>
        <a
          href={TOUR_HREF}
          className="inline-flex items-center gap-2 rounded-pill bg-background px-7 py-3.5 text-base font-bold text-primary shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background"
        >
          Start the Rotterdam tour
          <span aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  );
}
