import { defineConfig } from "astro/config";
import vaultcss from "vite-plugin-vaultcss";
// @ts-check

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [
      vaultcss({
        fluid: {
          unit: "cqi",
        },
        customMedia: {
          "--project-mobile": "(width <= 768px)",
        },
      }),
    ],
    // css: {
    //   transformer: "lightningcss",
    // },
  },

  server: {
    host: true,
    open: true,
  },
});
