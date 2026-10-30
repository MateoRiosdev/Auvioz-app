import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { synthesize, validate, run, languages } from "./audio.mjs";
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
const dist = resolve(fileURLToPath(new URL("../dist/", import.meta.url)));
let active = 0;
const json = (res, status, data) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store",
  });
  res.end(JSON.stringify(data));
};
const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  if (path === "/api/health") {
    try {
      const voices = await run(process.env.ESPEAK_BIN || "espeak-ng", [
        "--voices",
      ]);
      await run(process.env.FFMPEG_BIN || "ffmpeg", ["-version"]);
      json(res, 200, {
        ready: true,
        languages: Object.entries(languages)
          .filter(([, v]) =>
            voices
              .split("\n")
              .some((line) => line.trim().split(/\s+/)[1] === v),
          )
          .map(([k]) => k),
      });
    } catch {
      json(res, 503, { error: "ENGINE_UNAVAILABLE" });
    }
    return;
  }
  if (path === "/api/synthesize" && req.method === "POST") {
    if (req.headers.origin) {
      let origin;
      try {
        origin = new URL(req.headers.origin).host;
      } catch {
        return json(res, 403, { error: "ORIGIN_REJECTED" });
      }
      if (origin !== req.headers.host && !((process.env.AUVIOZ_ALLOWED_ORIGINS || "http://127.0.0.1:5173").split(",").includes(req.headers.origin)))
        return json(res, 403, { error: "ORIGIN_REJECTED" });
    }
    if (active >= 2) return json(res, 429, { error: "BUSY" });
    const chunks = []; let size = 0;
    active++;
    try {
      for await (const chunk of req) {
        chunks.push(chunk); size += chunk.length;
        if (size > 40000) {
          json(res, 413, { error: "INVALID_INPUT" });
          return;
        }
      }
      let input;
      try {
        input = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        validate(input);
      } catch {
        json(res, 400, { error: "INVALID_INPUT" });
        return;
      }
      const audio = await synthesize(input);
      res.writeHead(200, {
        "Content-Type": input.format === "mp3" ? "audio/mpeg" : "audio/wav",
        "Content-Length": audio.length,
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="auvioz.${input.format === "mp3" ? "mp3" : "wav"}"`,
      });
      res.end(audio);
    } catch {
      json(res, 503, { error: "SYNTHESIS_FAILED" });
    } finally {
      active--;
    }
    return;
  }
  if (path.startsWith("/api/")) return json(res, 404, { error: "NOT_FOUND" });
  if (req.method !== "GET")
    return json(res, 405, { error: "METHOD_NOT_ALLOWED" });
  try {
    const requested = resolve(dist, "." + decodeURIComponent(path));
    if (
      !requested.startsWith(dist.endsWith(sep) ? dist : dist + sep) &&
      requested !== dist
    )
      return json(res, 403, { error: "FORBIDDEN" });
    let file = requested;
    let data;
    try {
      data = await readFile(file);
    } catch {
      if (extname(path) && path !== "/")
        return json(res, 404, { error: "NOT_FOUND" });
      file = resolve(dist, "index.html");
      data = await readFile(file);
    }
    const types = {
      ".html": "text/html",
      ".js": "text/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".jpg": "image/jpeg",
      ".png": "image/png",
      ".json": "application/json",
      ".mp4": "video/mp4",
    };
    if (extname(file) === ".mp4" && req.headers.range) {
      const match = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
      let start = match?.[1] ? Number(match[1]) : 0;
      let end = match?.[2] ? Number(match[2]) : data.length - 1;
      if (match && !match[1] && match[2]) {start = Math.max(0,data.length-Number(match[2]));end=data.length-1;}
      end = Math.min(end,data.length-1);
      if (!match || (!match[1] && !match[2]) || start > end || start >= data.length) {
        res.writeHead(416,{"Content-Range":`bytes */${data.length}`});res.end();return;
      }
      res.writeHead(206,{"Content-Type":"video/mp4","Accept-Ranges":"bytes","Content-Range":`bytes ${start}-${end}/${data.length}`,"Content-Length":end-start+1});
      res.end(data.subarray(start,end+1));return;
    }
    res.writeHead(200, {
      "Content-Length":data.length,
      "Accept-Ranges":"bytes",
      "Content-Type": types[extname(file)] || "application/octet-stream",
    });
    res.end(data);
  } catch {
    json(res, 404, { error: "NOT_FOUND" });
  }
});
server.listen(
  Number(process.env.PORT || 3001),
  process.env.HOST || "127.0.0.1",
);
