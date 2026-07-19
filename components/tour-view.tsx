"use client";

import { useState } from "react";
import { Stop, Taal, Tour, navigatieLink } from "@/lib/types";

type Props = {
  tour: Tour;
  stops: Stop[];
};

const CATEGORY_COLORS = [
  "bg-accent-1 text-accent-1-foreground",
  "bg-accent-2 text-accent-2-foreground",
  "bg-primary text-primary-foreground",
];

const LABELS: Record<Taal, { stop: string; stops: string; navigate: string; mapComing: string }> = {
  nl: { stop: "stop", stops: "stops", navigate: "Navigeer", mapComing: "Kaart volgt" },
  en: { stop: "stop", stops: "stops", navigate: "Navigate", mapComing: "Map coming soon" },
};

function PulsePin() {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center mt-1">
      <span className="motion-safe:animate-pulse-pin absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
    </span>
  );
}

function LanguageToggle({ lang, onChange }: { lang: Taal; onChange: (l: Taal) => void }) {
  return (
    <div className="flex items-center gap-1.5" role="group" aria-label="Taal">
      {(["nl", "en"] as const).map((l) => {
        const active = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            aria-pressed={active}
            className={[
              "rounded-pill px-3 py-1 text-[11px] font-bold uppercase tracking-wide transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "border border-primary text-primary hover:bg-primary/10",
            ].join(" ")}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

export function TourView({ tour, stops }: Props) {
  const [lang, setLang] = useState<Taal>("nl");
  const t = LABELS[lang];

  const title = lang === "en" && tour.title_en ? tour.title_en : tour.titel;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[440px] px-4 py-8 space-y-5">

        {/* Header */}
        <header className="space-y-1 pt-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              {tour.stad}&nbsp;·&nbsp;{stops.length} {stops.length === 1 ? t.stop : t.stops}
            </p>
            <LanguageToggle lang={lang} onChange={setLang} />
          </div>
          <h1 className="text-[2rem] font-black tracking-tight leading-[1.1] text-foreground">
            {title}
          </h1>
        </header>

        {/* Map block */}
        {tour.map_embed_url ? (
          <div className="overflow-hidden rounded-2xl shadow-md">
            <iframe
              src={tour.map_embed_url}
              className="w-full h-64"
              loading="lazy"
              title="Tourkaart"
            />
          </div>
        ) : (
          <div className="w-full h-32 rounded-2xl border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground">
            {t.mapComing}
          </div>
        )}

        {/* Stops */}
        <ol className="space-y-3">
          {stops.map((stop, i) => {
            const isActive = i === 0;
            const categoryColor = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
            const content =
              lang === "en" ? stop.content_volwassenen_en : stop.content_volwassenen_nl;
            const audioUrl =
              lang === "en" ? stop.audio_url_volwassenen_en : stop.audio_url_volwassenen_nl;

            return (
              <li
                key={stop.id}
                className={[
                  "rounded-2xl bg-card px-4 py-4 transition-shadow",
                  isActive
                    ? "ring-2 ring-primary/30 shadow-sm"
                    : "shadow-sm border border-border/60",
                ].join(" ")}
              >
                <div className="flex gap-3">
                  {/* Linkerkolom: volgnummer + pulse pin */}
                  <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold select-none">
                      {i + 1}
                    </span>
                    {isActive && <PulsePin />}
                  </div>

                  {/* Rechterkolom: inhoud */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-[0.95rem] leading-snug text-card-foreground">
                        {stop.naam}
                      </h2>
                      {stop.categorie && (
                        <span
                          className={`inline-flex items-center rounded-pill px-2.5 py-0.5 text-[10px] font-semibold shrink-0 ${categoryColor}`}
                        >
                          {stop.categorie}
                        </span>
                      )}
                    </div>

                    {content && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {content}
                      </p>
                    )}

                    {audioUrl && (
                      <audio
                        key={audioUrl}
                        controls
                        src={audioUrl}
                        className="w-full mt-1"
                      />
                    )}

                    <a
                      href={navigatieLink(stop.lat, stop.lng)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-pill bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary transition-opacity"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {t.navigate}
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </main>
  );
}
