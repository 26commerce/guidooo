/**
 * Vertaalt content_volwassenen_nl + audioscript_volwassenen_nl naar het Engels via Claude,
 * synthetiseert audio via ElevenLabs (EN voice) en upload naar Supabase Storage.
 * Idempotent: stops met bestaande content_volwassenen_en + audio_url_volwassenen_en worden overgeslagen.
 *
 * Gebruik:
 *   npx tsx scripts/generate-content-en.ts [tour-id] [test|all]
 *   (default tour-id: tour-01, default mode: test — verwerkt dan alleen de eerste stop)
 *
 *   Stap 1: npx tsx scripts/generate-content-en.ts tour-01 test
 *   Stap 2 (na goedkeuring): npx tsx scripts/generate-content-en.ts tour-01 all
 *
 * Vereiste keys in .env.local:
 *   ANTHROPIC_API_KEY
 *   ELEVENLABS_API_KEY
 *   ELEVENLABS_VOICE_ID_EN
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

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

const required = [
  "ANTHROPIC_API_KEY",
  "ELEVENLABS_API_KEY",
  "ELEVENLABS_VOICE_ID_EN",
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
const EL_VOICE_EN = process.env.ELEVENLABS_VOICE_ID_EN!;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabaseRead = createClient(SUPABASE_URL, ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Stop = {
  id: string;
  naam: string;
  volgorde: number;
  content_volwassenen_nl: string | null;
  audioscript_volwassenen_nl: string | null;
  content_volwassenen_en: string | null;
  audioscript_volwassenen_en: string | null;
  audio_url_volwassenen_en: string | null;
};

type Translated = {
  content_volwassenen_en: string;
  audioscript_volwassenen_en: string;
};

async function translateStop(stop: Stop): Promise<Translated> {
  const prompt = `Vertaal onderstaande Nederlandse tour-content naar natuurlijk, idiomatisch Engels. Behoud de "local friend" toon: warm, informeel, alsof een local je insider-tips geeft. Geen letterlijke woord-voor-woord vertaling — herschrijf zodat het als oorspronkelijk Engels klinkt. Houd de lengte ongeveer gelijk aan het origineel.

CONTENT_VOLWASSENEN (NL):
${stop.content_volwassenen_nl}

AUDIOSCRIPT (NL):
${stop.audioscript_volwassenen_nl}

Geef je antwoord in dit exacte formaat — geen extra tekst ervoor of erna:

CONTENT_VOLWASSENEN_EN:
[vertaling hier]

AUDIOSCRIPT_EN:
[vertaling hier]`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are a professional Dutch-to-English translator specializing in warm, conversational travel content. Write natural, idiomatic English in the voice of a friendly local giving insider tips — casual, second person ('you'), present tense where natural. Never a literal translation.",
    messages: [{ role: "user", content: prompt }],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  const contentMatch = raw.match(
    /CONTENT_VOLWASSENEN_EN:\s*([\s\S]*?)(?=\n\nAUDIOSCRIPT_EN:)/
  );
  const audioMatch = raw.match(/AUDIOSCRIPT_EN:\s*([\s\S]*?)$/);

  if (!contentMatch || !audioMatch) {
    throw new Error(
      `Claude gaf een onverwacht formaat terug:\n${raw.slice(0, 300)}`
    );
  }

  return {
    content_volwassenen_en: contentMatch[1].trim(),
    audioscript_volwassenen_en: audioMatch[1].trim(),
  };
}

async function synthesizeAudio(text: string): Promise<Buffer> {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${EL_VOICE_EN}`,
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

async function uploadAudio(tourId: string, stopId: string, audio: Buffer): Promise<string> {
  const path = `${tourId}/${stopId}-en.mp3`;
  const { error } = await supabaseAdmin.storage
    .from("audio")
    .upload(path, audio, { contentType: "audio/mpeg", upsert: true });
  if (error) throw new Error(`Upload mislukt: ${error.message}`);
  const { data } = supabaseAdmin.storage.from("audio").getPublicUrl(path);
  return data.publicUrl;
}

async function updateStop(
  stopId: string,
  content: Translated,
  audioUrl: string | null
) {
  const { error } = await supabaseAdmin
    .from("stops")
    .update({
      content_volwassenen_en: content.content_volwassenen_en,
      audioscript_volwassenen_en: content.audioscript_volwassenen_en,
      ...(audioUrl ? { audio_url_volwassenen_en: audioUrl } : {}),
    })
    .eq("id", stopId);
  if (error) throw new Error(`DB update mislukt: ${error.message}`);
}

async function processStop(stop: Stop, tourId: string): Promise<void> {
  console.log(`\n[${stop.volgorde}/9] ${stop.naam}`);

  let content: Translated;
  if (stop.content_volwassenen_en && stop.audioscript_volwassenen_en) {
    console.log("  ℹ Tekst al aanwezig — alleen audio genereren");
    content = {
      content_volwassenen_en: stop.content_volwassenen_en,
      audioscript_volwassenen_en: stop.audioscript_volwassenen_en,
    };
  } else {
    process.stdout.write("  → Claude vertaalt content...");
    content = await translateStop(stop);
    console.log(" ✓");
    console.log(`\n  CONTENT_VOLWASSENEN_EN:\n  ${content.content_volwassenen_en}`);
    console.log(`\n  AUDIOSCRIPT_EN:\n  ${content.audioscript_volwassenen_en}\n`);
  }

  let audioUrl: string | null = null;
  process.stdout.write("  → ElevenLabs synthetiseert EN audio...");
  try {
    const audioBuffer = await synthesizeAudio(content.audioscript_volwassenen_en);
    process.stdout.write(" uploaden naar Supabase...");
    audioUrl = await uploadAudio(tourId, stop.id, audioBuffer);
    console.log(" ✓");
    console.log(`  Audio URL: ${audioUrl}`);
  } catch (err) {
    console.log(` ✗ (${(err as Error).message})`);
    console.log("  Content wordt wél opgeslagen, audio niet.");
  }

  process.stdout.write("  → Supabase updaten...");
  await updateStop(stop.id, content, audioUrl);
  console.log(" ✓");
}

async function main() {
  const tourId = process.argv[2] ?? "tour-01";
  const mode = process.argv[3] ?? "test";
  console.log(`\n=== Guidooo EN content pipeline — tour: ${tourId} (${mode}) ===\n`);

  const { data: stops, error } = await supabaseRead
    .from("stops")
    .select(
      "id, naam, volgorde, content_volwassenen_nl, audioscript_volwassenen_nl, content_volwassenen_en, audioscript_volwassenen_en, audio_url_volwassenen_en"
    )
    .eq("tour_id", tourId)
    .order("volgorde", { ascending: true })
    .returns<Stop[]>();

  if (error || !stops) {
    console.error(`✗ Stops ophalen mislukt: ${error?.message}`);
    process.exit(1);
  }

  const missingSource = stops.filter(
    (s) => !s.content_volwassenen_nl || !s.audioscript_volwassenen_nl
  );
  if (missingSource.length > 0) {
    console.log(
      `⚠ ${missingSource.length} stop(s) hebben geen NL brontekst — overgeslagen: ` +
        missingSource.map((s) => s.naam).join(", ")
    );
  }

  const todo = stops.filter(
    (s) =>
      s.content_volwassenen_nl &&
      s.audioscript_volwassenen_nl &&
      (!s.content_volwassenen_en || !s.audio_url_volwassenen_en)
  );
  const skipped = stops.length - missingSource.length - todo.length;

  if (skipped > 0) {
    console.log(`ℹ ${skipped} stop(s) overgeslagen (EN content + audio compleet)`);
  }

  if (todo.length === 0) {
    console.log("✓ Alle stops zijn al verwerkt. Klaar!\n");
    return;
  }

  const batch = mode === "all" ? todo : todo.slice(0, 1);
  console.log(`Te verwerken: ${batch.length} van ${todo.length} stop(s) (mode: ${mode})`);

  for (const stop of batch) {
    await processStop(stop, tourId);
  }

  if (mode === "test" && todo.length > 1) {
    console.log(
      `\n── TESTMODUS klaar. Controleer de EN output hierboven. ──\nDoorgaan met de resterende ${todo.length - 1} stop(s)? Run:\n  npx tsx scripts/generate-content-en.ts ${tourId} all\n`
    );
  } else {
    console.log("\n✓ Alle stops verwerkt. Klaar!\n");
  }
}

main().catch((err) => {
  console.error("✗ Onverwachte fout:", err);
  process.exit(1);
});
