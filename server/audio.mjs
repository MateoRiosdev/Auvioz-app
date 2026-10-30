import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
export const languages = {
  es: "es",
  en: "en-us",
  pt: "pt-br",
  fr: "fr-fr",
  de: "de",
  it: "it",
  ja: "ja",
  zh: "cmn",
  ru: "ru",
  ar: "ar",
  hi: "hi",
  tr: "tr",
};
import { normalizeText } from "../shared/text.js";
export { normalizeText } from "../shared/text.js";
export function validate(input) {
  const {
    text,
    language = "es",
    volume = 1,
    rate = 1,
    sampleRate = 24000,
    format = "wav",
    clean = true,
  } = input;
  if (
    typeof text !== "string" ||
    !text.trim() ||
    text.length > 5000 ||
    !languages[language] ||
    ![16000, 22050, 24000, 44100, 48000].includes(sampleRate) ||
    !["mp3", "wav"].includes(format) ||
    typeof clean !== "boolean" ||
    !Number.isFinite(volume) ||
    volume < 0.1 ||
    volume > 1 ||
    !Number.isFinite(rate) ||
    rate < 0.5 ||
    rate > 2
  )
    throw new Error("INVALID_INPUT");
  const normalized = normalizeText(text, clean);
  if (!normalized) throw new Error("INVALID_INPUT");
  return { text: normalized, language, volume, rate, sampleRate, format };
}
export function run(command, args, input) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"] });
    let error = "";
    let stdout = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), 60000);
    child.stdout.on("data", (d) => {
      stdout += d;
    });
    child.stderr.on("data", (d) => {
      error += d;
    });
    child.on("error", (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0
        ? resolve(stdout)
        : reject(new Error(error.slice(-500) || "ENGINE_FAILED"));
    });
    child.stdin.on("error", () => {});
    child.stdin.end(input);
  });
}
export async function synthesize(input) {
  const options = validate(input);
  const dir = await mkdtemp(join(tmpdir(), "auvioz-"));
  try {
    const raw = join(dir, "raw.wav"),
      output = join(dir, `audio.${options.format}`);
    await run(
      process.env.ESPEAK_BIN || "espeak-ng",
      [
        "-v",
        languages[options.language],
        "-s",
        String(Math.round(175 * options.rate)),
        "-w",
        raw,
        "--stdin",
      ],
      options.text,
    );
    await run(process.env.FFMPEG_BIN || "ffmpeg", [
      "-nostdin",
      "-hide_banner",
      "-loglevel",
      "error",
      "-y",
      "-i",
      raw,
      "-af",
      `volume=${options.volume}`,
      "-ar",
      String(options.sampleRate),
      "-ac",
      "1",
      ...(options.format === "mp3"
        ? ["-codec:a", "libmp3lame", "-b:a", "128k"]
        : ["-codec:a", "pcm_s16le"]),
      output,
    ]);
    const audio = await readFile(output);
    if (audio.length < 100) throw new Error("EMPTY_AUDIO");
    return audio;
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
