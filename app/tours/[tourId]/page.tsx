import { supabase } from "@/lib/supabase";
import { Stop, Tour, navigatieLink } from "@/lib/types";

type Props = {
  params: Promise<{ tourId: string }>;
};

const CATEGORY_COLORS = [
  "bg-accent-1 text-accent-1-foreground",
  "bg-accent-2 text-accent-2-foreground",
  "bg-primary text-primary-foreground",
];

function PulsePin() {
  return (
    <span className="relative flex h-4 w-4 items-center justify-center mt-1">
      <span className="motion-safe:animate-pulse-pin absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
    </span>
  );
}

export default async function TourPage({ params }: Props) {
  const { tourId } = await params;

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .single<Tour>();

  if (tourError || !tour) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center p-6">
        <p className="text-accent-2 text-sm text-center">
          Tour &quot;{tourId}&quot; niet gevonden. Klopt het ID, en staat de
          rij in de Supabase tabel &quot;tours&quot;?
        </p>
      </main>
    );
  }

  const { data: stops } = await supabase
    .from("stops")
    .select("*")
    .eq("tour_id", tourId)
    .order("volgorde", { ascending: true })
    .returns<Stop[]>();

  const stopList = stops ?? [];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[440px] px-4 py-8 space-y-5">

        {/* Header */}
        <header className="space-y-1 pt-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            {tour.stad}&nbsp;·&nbsp;{stopList.length}{" "}
            {stopList.length === 1 ? "stop" : "stops"}
          </p>
          <h1 className="text-[2rem] font-black tracking-tight leading-[1.1] text-foreground">
            {tour.titel}
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
            Kaart volgt
          </div>
        )}

        {/* Stops */}
        <ol className="space-y-3">
          {stopList.map((stop, i) => {
            const isActive = i === 0;
            const categoryColor = CATEGORY_COLORS[i % CATEGORY_COLORS.length];

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

                    {stop.content_volwassenen && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {stop.content_volwassenen}
                      </p>
                    )}

                    {stop.audio_url && (
                      <audio
                        controls
                        src={stop.audio_url}
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
                      Navigeer
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
