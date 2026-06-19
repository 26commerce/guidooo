/**
 * Genereert content_volwassenen + audioscript voor alle stops van een tour via Claude,
 * synthetiseert audio via ElevenLabs en upload naar Supabase Storage.
 * Idempotent: stops met bestaande content_volwassenen worden overgeslagen.
 *
 * Gebruik:
 *   npx tsx scripts/generate-content.ts [tour-id]
 *   (default tour-id: tour-01)
 *
 * Vereiste keys in .env.local:
 *   ANTHROPIC_API_KEY
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY   ← nodig voor storage-uploads en db-updates
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import * as readline from "readline";

// ── .env.local laden ─────────────────────────────────────────────────────────
function loadEnvFile() {
  try {
    const raw = readFileSync(".env.local", "utf-8");
    for (const line of raw.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 1) continue;
      const key = t.slice(0, i).trim();
      const val = t.slice(i + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {}
}
loadEnvFile();

// ── Env vars valideren ────────────────────────────────────────────────────────
const required = [
  "ANTHROPIC_API_KEY",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];
const missing = required.filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(
    "✗ Missende env vars in .env.local:\n" +
      missing.map((k) => `  ${k}`).join("\n")
  );
  process.exit(1);
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const EL_KEY = process.env.ELEVENLABS_API_KEY!;
const EL_VOICE = process.env.ELEVENLABS_VOICE_ID!;

// ── Clients ───────────────────────────────────────────────────────────────────
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// anon key: lezen (RLS publiek leesbaar)
const supabaseRead = createClient(SUPABASE_URL, ANON_KEY);
// service role: schrijven naar stops + storage
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Insider data per stop ─────────────────────────────────────────────────────
type InsiderData = {
  id: string;
  naam: string;
  volgorde: number;
  insider: string;
};

const INSIDER_DATA: InsiderData[] = [
  {
    id: "stop-01",
    naam: "Rotterdam Centraal",
    volgorde: 1,
    insider:
      "Geopend in 2014, ontworpen door Team CS (Benthem Crouwel + Meyer & Van Schooten). Het enorme dak is bekleed met geborsteld rvs dat bij avondzon oranje gloeit. De stationshal zelf is een architectonisch kunstwerk — kijk omhoog naar de stalen luifel. De ondergrondse fietsenstalling is 's werelds grootste overdekte fietsenstalling: 5.000 plekken op drie verdiepingen onder het plein.",
  },
  {
    id: "stop-02",
    naam: "Luchtsingel",
    volgorde: 2,
    insider:
      "'s Werelds eerste crowdfunded voetgangersbrug (2015). Gebouwd met geld van 5.000 mensen die elk een houten bordplaatje kochten — hun namen staan er letterlijk in gegraveerd. De brug verbindt drie vroeger geïsoleerde wijken: Bergpolder, Agniesebuurt en de Hofbogen. Die Hofbogen zijn ook interessant: een historisch spoolviaduct omgebouwd tot ateliers en studios. Kijk ook omlaag naar de spoortunnel onder je voeten.",
  },
  {
    id: "stop-03",
    naam: "Markthal",
    volgorde: 3,
    insider:
      "Gratis toegang — de food is duur, maar binnenkijken kost niks. Het plafondkunstwerk 'Cornucopia' van Arno Coenen beslaat 11.000 m² digitale print: de grootste kunstwerk in Nederland. Boven de markt wonen 228 mensen in glazen appartementen — ze kijken letterlijk neer op de groentekramen. Ga er voor 11 uur op een doordeweekse dag voor rust. Op zaterdag is het druk maar gezellig.",
  },
  {
    id: "stop-04",
    naam: "Kubuswoningen",
    volgorde: 4,
    insider:
      "Ontworpen door Piet Blom in 1984. Elk kubus staat op een hoekpunt — 54 graden gedraaid op een betonnen paal. De gedachte: elke kubus is een boom, het geheel is een bos boven de stad. De meeste zijn gewone koopappartementen waar Rotterdammers in wonen. Eén kubus, de Kijk-Kubus (nummer 70), is open voor bezoekers: €3 om te zien hoe schuin wonen echt voelt.",
  },
  {
    id: "stop-05",
    naam: "Oude Haven & Witte Huis",
    volgorde: 5,
    insider:
      "Dit is de geboorteplaats van Rotterdam — in de 13e eeuw werd hier een dam gebouwd in de Rotte. Het Witte Huis (1898) was de eerste 'wolkenkrabber' van Europa: 10 verdiepingen, art nouveau, en het stond hier al toen de Eiffeltoren pas 10 jaar oud was. De restauratieschepen in het water worden vrijwillig onderhouden. 's Avonds zijn de terrasjes hier een van de gezelligste plekken van de stad.",
  },
  {
    id: "stop-06",
    naam: "Erasmusbrug",
    volgorde: 6,
    insider:
      "Ontworpen door Ben van Berkel (UNStudio), geopend in 1996. Bijnaam: De Zwaan, vanwege de asymmetrische witte pylon van 139 meter. Volledig gratis om over te lopen — en dat moet je doen voor het ultieme panorama over de Maas. Beste fotoplek: sta op de noordzijde (Boompjeskade) vroeg in de ochtend met de zon achter je. Bij wind wiebelt de brug — dat is normaal, de dempers zijn expres zo ontworpen.",
  },
  {
    id: "stop-07",
    naam: "Hotel New York / Wilhelminakade",
    volgorde: 7,
    insider:
      "Tussen 1873 en 1971 vertrokken 650.000 emigranten vanuit deze kade richting Amerika met de Holland America Line. Het imposante hoofdgebouw uit 1901 is nu een iconisch hotel. Je kunt gewoon naar binnen lopen voor een koffie of drankje op het terras — perfect voor het onverslaanbare uitzicht op de Erasmusbrug. De twee torens op het dak waren vroeger uitkijkposten van de rederij.",
  },
  {
    id: "stop-08",
    naam: "Kruising Hillelaan x Posthumalaan",
    volgorde: 8,
    insider:
      "Dit is het best bewaarde geheim van Rotterdam. Geen bord, geen toeristen, geen Instagram-drukte. Op de kruising van Hillelaan en Posthumalaan heb je een ongehinderd zicht op de volledige Rotterdamse skyline — inclusief De Hef (het kleurrijke historische spoorbrug) en de moderne wolkenkrabbers als Maastoren en First Rotterdam. Beste resultaat bij golden hour of het blauwe uur net na zonsondergang.",
  },
  {
    id: "stop-09",
    naam: "Fenix / De Tornado, Katendrecht",
    volgorde: 9,
    insider:
      "Katendrecht was vroeger de 'kaap' van Rotterdam — befaamd als zeeliedenbuurt met een rauw karakter. Nu is het de hipste wijk van de stad. Fenix I is een voormalige havenloods, nu gevuld met winkels, ateliers en de Fenix Food Factory. De Tornado-toren naast het gebouw is gratis toegankelijk: 38 meter hoog, 360 graden uitzicht over de Maas en het havengebied. Terug naar huis: 5 minuten lopen naar metrostation Rijnhaven (lijn D/E), dan 7-10 minuten terug naar Centraal.",
  },
];

// ── Types ─────────────────────────────────────────────────────────────────────
type Stop = {
  id: string;
  naam: string;
  volgorde: number;
  categorie: string | null;
  content_volwassenen: string | null;
  audioscript: string | null;
  audio_url: string | null;
};

type GeneratedContent = {
  content_volwassenen: string;
  audioscript: string;
};

// ── Claude: content genereren ─────────────────────────────────────────────────
async function generateContent(
  stop: Stop,
  insider: string
): Promise<GeneratedContent> {
  const isLastStop = stop.volgorde === 9;

  const stop9Extra = isLastStop
    ? `
Extra instructies voor de laatste stop:
- Begin met de gratis buitenkant (Fenix-gebouw, Tornado-toren) als het hoofdtip — benadruk dat het gratis is.
- Noem de Tornado rooftop als optionele bonus met een vleugje humor ("als je zin hebt in wat hoogtevrees...").
- Sluit het audioscript af met de terugkeerroute: "Loop 5 minuten naar metrostation Rijnhaven (lijn D of E), dan 7 à 10 minuten terug naar Centraal."
- Eindig met een review-CTA: "Vond je deze tour leuk? Laat even een reviewtje achter — je helpt ons er enorm mee!"
`
    : "";

  const prompt = `Stop: ${stop.naam}
Categorie: ${stop.categorie ?? ""}
Insider kennis: ${insider}

Genereer twee stukken tekst in het Nederlands:

1. CONTENT_VOLWASSENEN (exact 1 à 2 zinnen): Een pakkende teaser die de bezoeker triggert om naar deze stop te gaan. Spreek aan als "je/jij", tegenwoordige tijd, alsof een lokale vriend je tips geeft.

2. AUDIOSCRIPT (130-180 woorden, tel dit zorgvuldig): Een audiofragment dat een gids voorleest via een koptelefoon. Begin direct met de plek — geen "welkom bij" of introductie. Warm, concreet, insider-gevoel. Tegenwoordige tijd, je/jij.
${stop9Extra}
Geef je antwoord in dit exacte formaat — geen extra tekst ervoor of erna:

CONTENT_VOLWASSENEN:
[jouw tekst hier]

AUDIOSCRIPT:
[jouw tekst hier]`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "Je bent een Nederlandstalige reisschrijver met de stem van een lokale vriend. Schrijf altijd in de tegenwoordige tijd, spreek de lezer aan als 'je/jij', gebruik nooit formeel taalgebruik of toeristische clichés. Stijl: warm, concreet, vol insider-kennis.",
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  const contentMatch = raw.match(
    /CONTENT_VOLWASSENEN:\s*([\s\S]*?)(?=\n\nAUDIOSCRIPT:)/
  );
  const audioMatch = raw.match(/AUDIOSCRIPT:\s*([\s\S]*?)$/);

  if (!contentMatch || !audioMatch) {
    throw new Error(
      `Claude gaf een onverwacht formaat terug:\n${raw.slice(0, 300)}`
    );
  }

  return {
    content_volwassenen: contentMatch[1].trim(),
    audioscript: audioMatch[1].trim(),
  };
}

// ── ElevenLabs: tekst naar audio ──────────────────────────────────────────────
async function synthesizeAudio(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": EL_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`ElevenLabs fout (${res.status}): ${err}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── Supabase Storage: audio uploaden ─────────────────────────────────────────
async function ensureAudioBucket() {
  const { data: buckets } = await supabaseAdmin.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === "audio");
  if (!exists) {
    const { error } = await supabaseAdmin.storage.createBucket("audio", {
      public: true,
    });
    if (error) throw new Error(`Bucket aanmaken mislukt: ${error.message}`);
    console.log('  ✓ Storage bucket "audio" aangemaakt');
  }
}

async function uploadAudio(tourId: string, stopId: string, audio: Buffer): Promise<string> {
  const path = `${tourId}/${stopId}.mp3`;
  const { error } = await supabaseAdmin.storage
    .from("audio")
    .upload(path, audio, { contentType: "audio/mpeg", upsert: true });
  if (error) throw new Error(`Upload mislukt: ${error.message}`);
  const { data } = supabaseAdmin.storage.from("audio").getPublicUrl(path);
  return data.publicUrl;
}

// ── Supabase DB: stop updaten ─────────────────────────────────────────────────
async function updateStop(
  stopId: string,
  content: GeneratedContent,
  audioUrl: string | null
) {
  const { error } = await supabaseAdmin
    .from("stops")
    .update({
      content_volwassenen: content.content_volwassenen,
      audioscript: content.audioscript,
      ...(audioUrl ? { audio_url: audioUrl } : {}),
    })
    .eq("id", stopId);
  if (error) throw new Error(`DB update mislukt: ${error.message}`);
}

// ── User input ────────────────────────────────────────────────────────────────
async function askContinue(): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(
      "\n→ Ziet er goed uit? Doorgaan met alle resterende stops? (j/n): ",
      (ans) => {
        rl.close();
        resolve(ans.trim().toLowerCase() === "j");
      }
    );
  });
}

// ── Eén stop verwerken ────────────────────────────────────────────────────────
async function processStop(stop: Stop, tourId: string): Promise<void> {
  const insiderEntry = INSIDER_DATA.find((d) => d.id === stop.id);
  if (!insiderEntry) {
    console.log(`  ⚠ Geen insider data voor ${stop.id} — overgeslagen`);
    return;
  }

  console.log(`\n[${stop.volgorde}/9] ${stop.naam}`);

  // 1. Content genereren via Claude (overslaan als al aanwezig)
  let content: GeneratedContent;
  if (stop.content_volwassenen && stop.audioscript) {
    console.log("  ℹ Tekst al aanwezig — alleen audio genereren");
    content = {
      content_volwassenen: stop.content_volwassenen,
      audioscript: stop.audioscript,
    };
  } else {
    process.stdout.write("  → Claude genereert content...");
    content = await generateContent(stop, insiderEntry.insider);
    console.log(" ✓");
    console.log(`\n  CONTENT_VOLWASSENEN:\n  ${content.content_volwassenen}`);
    console.log(`\n  AUDIOSCRIPT:\n  ${content.audioscript}\n`);
  }

  // 2. Audio synthetiseren via ElevenLabs
  let audioUrl: string | null = null;
  process.stdout.write("  → ElevenLabs synthetiseert audio...");
  try {
    const audioBuffer = await synthesizeAudio(content.audioscript);
    process.stdout.write(" uploaden naar Supabase...");
    audioUrl = await uploadAudio(tourId, stop.id, audioBuffer);
    console.log(" ✓");
    console.log(`  Audio URL: ${audioUrl}`);
  } catch (err) {
    console.log(` ✗ (${(err as Error).message})`);
    console.log("  Content wordt wél opgeslagen, audio niet.");
  }

  // 3. DB updaten
  process.stdout.write("  → Supabase updaten...");
  await updateStop(stop.id, content, audioUrl);
  console.log(" ✓");
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const tourId = process.argv[2] ?? "tour-01";
  console.log(`\n=== Guidooo content pipeline — tour: ${tourId} ===\n`);

  // Bucket voorbereiden
  await ensureAudioBucket();

  // Stops ophalen
  const { data: stops, error } = await supabaseRead
    .from("stops")
    .select(
      "id, naam, volgorde, categorie, content_volwassenen, audioscript, audio_url"
    )
    .eq("tour_id", tourId)
    .order("volgorde", { ascending: true })
    .returns<Stop[]>();

  if (error || !stops) {
    console.error(`✗ Stops ophalen mislukt: ${error?.message}`);
    process.exit(1);
  }

  // Stops die nog content OF audio missen
  const todo = stops.filter((s) => !s.content_volwassenen || !s.audio_url);
  const skipped = stops.length - todo.length;

  if (skipped > 0) {
    console.log(`ℹ ${skipped} stop(s) overgeslagen (content + audio compleet)`);
  }

  if (todo.length === 0) {
    console.log("✓ Alle stops zijn al verwerkt. Klaar!\n");
    return;
  }

  console.log(`Te verwerken: ${todo.length} stop(s)`);

  // TEST MODE: verwerk eerst alleen stop 1
  const firstStop = todo[0];
  console.log("\n── TESTMODUS: alleen eerste stop ──");
  await processStop(firstStop, tourId);

  if (todo.length === 1) {
    console.log("\n✓ Alle stops verwerkt. Klaar!\n");
    return;
  }

  // Wacht op goedkeuring
  const proceed = await askContinue();
  if (!proceed) {
    console.log("\nAfgebroken. Run het script opnieuw om door te gaan.\n");
    return;
  }

  // Resterende stops
  console.log("\n── Verwerkt resterende stops ──");
  for (const stop of todo.slice(1)) {
    await processStop(stop, tourId);
  }

  console.log("\n✓ Alle stops verwerkt. Klaar!\n");
}

main().catch((err) => {
  console.error("✗ Onverwachte fout:", err);
  process.exit(1);
});
