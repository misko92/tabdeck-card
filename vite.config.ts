import { defineConfig } from "vite";
import { execSync } from "node:child_process";

// Short commit + date, so the console shows exactly which build is loaded.
function buildId(): string {
  const date = new Date().toISOString().slice(0, 10);
  try {
    const sha = execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
    return `${sha} ${date}`;
  } catch {
    return date;
  }
}

export default defineConfig({
  define: { __TABDECK_BUILD__: JSON.stringify(buildId()) },
  build: {
    lib: {
      entry: "src/tabdeck-card.ts",
      formats: ["es"],
      fileName: () => "tabdeck-card.js",
    },
    rollupOptions: { output: { codeSplitting: false } },
    minify: "terser",
    sourcemap: false,
  },
});
