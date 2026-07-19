const STEPS = [
  {
    number: "1",
    title: "Open the tour on your phone",
    description: "Tap the link — it loads right in your browser.",
  },
  {
    number: "2",
    title: "Follow the map from stop to stop",
    description: "Nine handpicked stops across the city.",
  },
  {
    number: "3",
    title: "Press play and listen as you walk",
    description: "A friendly voice guides you the whole way.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <h2 className="text-center text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        How it works
      </h2>

      <ol className="mt-10 grid gap-6 sm:grid-cols-3 sm:gap-5">
        {STEPS.map((step) => (
          <li key={step.number} className="flex flex-col items-center gap-3 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-black text-primary-foreground shadow-sm">
              {step.number}
            </span>
            <h3 className="text-balance text-lg font-bold leading-snug text-foreground">
              {step.title}
            </h3>
            <p className="max-w-[15rem] text-sm leading-relaxed text-muted-foreground">
              {step.description}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
