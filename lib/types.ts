export type Doelgroep = "kinderen" | "jongvolwassenen" | "volwassenen";

export type Taal = "nl" | "en";

export type Tour = {
  id: string;
  stad: string;
  titel: string;
  title_en: string | null;
  taal: string;
  doelgroep: Doelgroep;
  status: string;
  // Src van een Google My Maps embed met alle stops als pins.
  // Eenmalig handmatig aanmaken in Google My Maps, dan de iframe src hier zetten.
  map_embed_url: string | null;
};

export type Stop = {
  id: string;
  tour_id: string;
  naam: string;
  stad: string;
  categorie: string | null;
  lat: number;
  lng: number;
  volgorde: number;
  content_kinderen: string | null;
  content_jongvolwassenen: string | null;
  content_volwassenen: string | null;
  audioscript: string | null;
  audio_url: string | null;
  content_volwassenen_nl: string | null;
  content_volwassenen_en: string | null;
  audio_url_volwassenen_nl: string | null;
  audio_url_volwassenen_en: string | null;
  taal: string;
};

// Deep link die op iOS Kaarten en op Android Google Maps opent met navigatie.
export function navigatieLink(lat: number, lng: number): string {
  return `https://maps.google.com/?q=${lat},${lng}`;
}
