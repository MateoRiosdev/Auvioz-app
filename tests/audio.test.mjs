try { process.loadEnvFile('.env.local'); } catch (error) { if(error.code!=='ENOENT') throw error; }
import test from "node:test";
import assert from "node:assert/strict";
import { normalizeText, validate, synthesize, run } from "../server/audio.mjs";
import { languages, messages } from "../src/i18n.js";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
test("symbols are removed without damaging multilingual letters or pause punctuation", () => {
  assert.equal(
    normalizeText("Hola... mundo / # prueba, sí.", true),
    "Hola. mundo prueba, sí.",
  );
  assert.equal(
    normalizeText("हिन्दी 日本語 العربية", true),
    "हिन्दी 日本語 العربية",
  );
  assert.equal(normalizeText("/#", false), "/#");
  assert.throws(() => validate({ text: "/#", clean: true }));
});
test("synthesis rejects invalid settings and unbounded text", () => {
  for (const input of [
    { text: "a", volume: 0 },
    { text: "a", sampleRate: 123 },
    { text: "a", language: "../../x" },
    { text: "a", rate: Infinity },
    { text: "x".repeat(5001) },
    { text: "a", format: "html" },
  ])
    assert.throws(() => validate(input));
});
test("all 12 interface locales have complete translations", () => {
  assert.equal(languages.length, 12);
  const keys = Object.keys(messages.es);
  for (const l of languages) {
    assert.deepEqual(Object.keys(messages[l.code]), keys);
    for (const key of keys)
      assert.ok(messages[l.code][key], `${l.code}.${key}`);
  }
});
test("WAV and MP3 decode to non-silent PCM at requested sample rates", async () => {
  const dir = await mkdtemp(join(tmpdir(), "auvioz-test-"));
  try {
    for (const format of ["wav", "mp3"])
      for (const sampleRate of [16000, 24000, 48000]) {
        const blob = await synthesize({
          text: "Hola, esta es una prueba de audio real.",
          language: "es",
          sampleRate,
          format,
        });
        const file = join(dir, `sample.${format}`);
        await writeFile(file, blob);
        const data = JSON.parse(
          await run("ffprobe", [
            "-v",
            "error",
            "-show_streams",
            "-of",
            "json",
            file,
          ]),
        );
        assert.equal(Number(data.streams[0].sample_rate), sampleRate);
        const pcm = join(dir, "audio.pcm");
        await run("ffmpeg", [
          "-y",
          "-v",
          "error",
          "-i",
          file,
          "-f",
          "s16le",
          pcm,
        ]);
        const { readFile } = await import("node:fs/promises");
        const samples = await readFile(pcm);
        let peak = 0;
        for (let i = 0; i < samples.length - 1; i += 2)
          peak = Math.max(peak, Math.abs(samples.readInt16LE(i)));
        assert.ok(peak > 100, `silent ${format}`);
      }
    const high = await synthesize({
      text: "Comprobación de volumen.",
      volume: 1,
    });
    const low = await synthesize({
      text: "Comprobación de volumen.",
      volume: 0.25,
    });
    const rms = (b) => {
      let sum = 0;
      for (let i = 44; i < b.length - 1; i += 2) sum += b.readInt16LE(i) ** 2;
      return Math.sqrt(sum / (b.length / 2));
    };
    assert.ok(rms(low) < rms(high) * 0.4);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
