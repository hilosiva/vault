// playgrounds/vite/vite.config.ts
import vaultcss from "vite-plugin-vaultcss";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vaultcss()],
  // css: {
  //   transformer: "lightningcss"
  // }
});
