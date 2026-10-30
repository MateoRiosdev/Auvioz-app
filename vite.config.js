import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execFileSync } from "node:child_process";
import process from "node:process";
let commit = process.env.VERCEL_GIT_COMMIT_SHA || "unknown";
if (commit === "unknown") {
  try {
    commit = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();
  } catch {
    /* Source archives may have no Git metadata. */
  }
}
export default defineConfig({
  plugins: [
    react(),
    {
      name: "auvioz-build-version",
      generateBundle() {
        this.emitFile({
          type: "asset",
          fileName: "version.json",
          source: JSON.stringify({ commit }),
        });
      },
    },
  ],
  server: { proxy: { "/api": "http://127.0.0.1:3001" } },
});
