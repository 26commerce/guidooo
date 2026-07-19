import { supabase } from "@/lib/supabase";
import { Stop, Tour } from "@/lib/types";
import { TourView } from "@/components/tour-view";

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

  return <TourView tour={tour} stops={stops ?? []} />;
}
