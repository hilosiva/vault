import path from "path";
import { VaultCss } from "vaultcss";
import type { PluginOptions as vaultOptions } from "vaultcss";
import type { Plugin, ResolvedConfig } from "vite";

export default function vaultcss(options: vaultOptions = {}): Plugin[] {
  let vault: VaultCss | null = null;
  let config: ResolvedConfig | null = null;
  let minify = false;
  let valutMediaQuery = false;

  function getExtension(id: string) {
    let [filename] = id.split("?", 2);
    return path.extname(filename).slice(1);
  }

  function isCss(id: string) {
    if (id.includes("/.vite/")) return;

    const ext = getExtension(id);

    const isCss = /(css|scss|sass|less)$/i.test(ext) || /[?&]lang\.(css|scss|sass|less)/i.test(id);
    return isCss;
  }

  return [
    {
      name: "vaultcss/vite:config",
      enforce: "pre",

      config: () => ({
        css: {
          lightningcss: {
            drafts: {
              customMedia: true,
            },
          },
        },
      }),
    },
    {
      name: "vaultcss/vite:scan",
      enforce: "pre",

      configResolved(resolvedConfig: ResolvedConfig) {
        config = resolvedConfig;
        minify = config.build.ssr === false && config.build.cssMinify !== false;
        valutMediaQuery = config.css.lightningcss?.drafts?.customMedia || false;
      },

      buildStart() {
        vault = new VaultCss({ valutMediaQuery: true, ...options, minify });
      },

      transform(code: string, id: string) {
        if (!vault || !isCss(id)) return;

        // prependGlobalImports is no longer needed - custom media is handled directly in optimize()
        return { code };
      },
    },
    {
      name: "vaultcss/vite:generate",

      async transform(code: string, id: string) {
        if (!vault || !isCss(id)) return;

        code = await vault.compiler(code);
        return { code };
      },
    },
  ] satisfies Plugin[];
}
