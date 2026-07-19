import Image from "next/image";
import { MapPin, Headphones } from "lucide-react";

const TOUR_HREF = "/tours/tour-01";

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[300px]">
      {/* Decorative pulsing pin floating over the phone */}
      <span className="absolute -left-3 top-10 z-20 flex h-6 w-6 items-center justify-center">
        <span className="motion-safe:animate-pulse-pin absolute inline-flex h-full w-full rounded-full bg-accent-2 opacity-60" />
        <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-accent-2 text-accent-2-foreground shadow-md">
          <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </span>

      {/* Phone frame */}
      <div className="rounded-[2.5rem] border-8 border-foreground/90 bg-foreground/90 shadow-2xl">
        <div className="overflow-hidden rounded-[2rem] bg-background">
          {/* App top bar */}
          <div className="flex items-center justify-between bg-primary px-4 py-3">
            <span className="text-xs font-black tracking-tight text-primary-foreground">
              Guidooo
            </span>
            <span className="rounded-pill bg-primary-foreground/20 px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
              Stop 1 / 9
            </span>
          </div>

          {/* Photo */}
          <div className="relative aspect-[3/4] w-full">
            <Image
              src="/images/rotterdam-cube-houses.png"
              alt="Rotterdam's yellow Cube Houses on a sunny day"
              fill
              sizes="300px"
              className="object-cover"
              priority
            />
            {/* Play card overlay */}
            <div className="absolute inset-x-3 bottom-3 flex items-center gap-3 rounded-2xl bg-background/95 px-3 py-2.5 shadow-lg backdrop-blur">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Headphones className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-foreground">
                  Kubuswoningen
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  2:14 · Press play as you walk
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  return (
    <section className="mx-auto max-w-5xl px-5 pb-8 pt-4 sm:px-8 sm:pb-16">
      <div className="grid items-center gap-10 md:grid-cols-2 md:gap-8">
        {/* Copy */}
        <div className="flex flex-col items-start gap-6">
          <span className="inline-flex items-center gap-2 rounded-pill bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Rotterdam · Self-guided audio tour
          </span>

          <h1 className="text-balance text-4xl font-black leading-[1.05] tracking-tight text-foreground sm:text-5xl">
            Skip the tour group. Walk it like a local.
          </h1>

          <p className="max-w-md text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            Guidooo is a self-guided audio walking tour that takes you straight
            to Rotterdam&apos;s best photo spots and hidden corners — no app to
            download, no group to keep up with, just you, your headphones, and a
            friend in your ear.
          </p>

          <a
            href={TOUR_HREF}
            className="inline-flex items-center gap-2 rounded-pill bg-primary px-7 py-3.5 text-base font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Start the Rotterdam tour
            <span aria-hidden="true">→</span>
          </a>
        </div>

        {/* Visual */}
        <div className="order-first md:order-last">
          <PhoneMockup />
        </div>
      </div>
    </section>
  );
}
