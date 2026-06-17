import { supabase } from "@/lib/supabase";
import { Stop, Tour, navigatieLink } from "@/lib/types";

type Props = {
  params: Promise<{ tourId: string }>;
};

export default async function TourPage({ params }: Props) {
  const { tourId } = await params;

  const { data: tour, error: tourError } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .single<Tour>();

  if (tourError || !tour) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <p className="text-red-600">
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

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">{tour.titel}</h1>
        <p className="text-sm text-neutral-500">
          {tour.stad} · {stops?.length ?? 0} stops
        </p>
      </header>

      {tour.map_embed_url ? (
        <iframe
          src={tour.map_embed_url}
          className="w-full h-80 rounded-lg border"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-40 rounded-lg border flex items-center justify-center text-sm text-neutral-400">
          Kaart nog niet ingesteld, voeg een Google My Maps embed src toe aan
          tour.map_embed_url
        </div>
      )}

      <ol className="space-y-6">
        {(stops ?? []).map((stop, i) => (
          <li key={stop.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">
                {i + 1}. {stop.naam}
              </h2>
              {stop.categorie && (
                <span className="text-xs text-neutral-500">
                  {stop.categorie}
                </span>
              )}
            </div>

            {stop.content_volwassenen && (
              <p className="text-sm">{stop.content_volwassenen}</p>
            )}

            {stop.audio_url && (
              <audio controls src={stop.audio_url} className="w-full" />
            )}

            <a
              href={navigatieLink(stop.lat, stop.lng)}
              target="_blank"
              className="inline-block text-sm text-blue-600 underline"
            >
              Navigeer naar deze stop
            </a>
          </li>
        ))}
      </ol>
    </main>
  );
}
