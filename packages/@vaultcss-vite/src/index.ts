import { VaultCss } from "vaultcss";
import type { PluginOptions as vaultOptions } from "vaultcss";
import type { Plugin, ResolvedConfig } from "vite";
import { normalizePath } from "vite";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join } from "path";

// vaultcss init が生成する mediaqueries.css に付与するマーカー
const VAULT_MARKER = "/* @vaultcss mediaqueries */";

// 走査対象外ディレクトリ
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".cache", ".vite", ".nuxt", ".output"]);

// CSS ファイルから @custom-media 定義をパース
function parseCustomMedia(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /@custom-media\s+(--[\w-]+)\s+([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = m[2].trim();
  }
  return result;
}

interface MediaQueriesFile {
  path: string;
  queries: Record<string, string>;
}

// プロジェクトルートを走査して VAULT_MARKER を含む CSS ファイルを探す
// normalizePath で Windows の \ → / に統一し、path.join でパスを組み立てる
function findVaultMediaQueriesFile(root: string): MediaQueriesFile | null {
  const normalizedRoot = normalizePath(root);

  function scan(dir: string, depth: number): { path: string; content: string } | null {
    if (depth > 3) return null;
    let entries: ReturnType<typeof readdirSync>;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return null; }

    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;

      if (entry.isFile() && entry.name.endsWith(".css")) {
        const filePath = join(dir, entry.name);
        try {
          const content = readFileSync(filePath, "utf-8");
          if (content.includes(VAULT_MARKER)) return { path: filePath, content };
        } catch { continue; }
      }

      if (entry.isDirectory()) {
        const result = scan(join(dir, entry.name), depth + 1);
        if (result) return result;
      }
    }
    return null;
  }

  const found = scan(normalizedRoot, 0);
  if (!found) return null;
  return { path: found.path, queries: parseCustomMedia(found.content) };
}

// vault を初期化（buildStart・HMR 再初期化で共用）
function initVault(
  options: vaultOptions,
  minify: boolean,
  userMediaQueries: Record<string, string> | null
): InstanceType<typeof VaultCss> {
  const mergedCustomMedia = { ...(userMediaQueries ?? {}), ...(options.customMedia ?? {}) };
  return new VaultCss({ ...options, customMedia: mergedCustomMedia, minify });
}

export default function vaultcss(options: vaultOptions = {}): Plugin[] {
  let vault: InstanceType<typeof VaultCss> | null = null;
  let config: ResolvedConfig | null = null;
  let minify = false;
  let watchedMediaQueriesFile: string | null = null;

  function getExtension(id: string) {
    const [filename] = id.split("?", 2);
    return filename.split(".").pop() || "";
  }

  function isCss(id: string) {
    if (id.includes("/.vite/")) return;
    const ext = getExtension(id);
    return /(css|scss|sass|less)$/i.test(ext) || /[?&]lang\.(css|scss|sass|less)/i.test(id);
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
      },

      buildStart() {
        // buildStart = 全 transform より確実に先に完了（Tailwind v4 と同じアプローチ）
        const found = config ? findVaultMediaQueriesFile(config.root) : null;
        if (found) watchedMediaQueriesFile = found.path;
        vault = initVault(options, minify, found?.queries ?? null);
      },

      configureServer(server) {
        // dev モード: mediaqueries.css を明示的にウォッチャーに登録して変更を監視
        const found = config ? findVaultMediaQueriesFile(config.root) : null;
        if (found) {
          watchedMediaQueriesFile = found.path;
          server.watcher.add(found.path); // 明示登録しないと監視されない
        }

        server.watcher.on("change", (file) => {
          if (normalizePath(file) !== normalizePath(watchedMediaQueriesFile ?? "")) return;
          try {
            const content = readFileSync(file, "utf-8");
            vault = initVault(options, minify, parseCustomMedia(content));

            // CSS の変換キャッシュを無効化してから full-reload
            for (const mod of server.moduleGraph.idToModuleMap.values()) {
              if (mod.id && isCss(mod.id)) {
                server.moduleGraph.invalidateModule(mod);
              }
            }
            server.hot.send({ type: "full-reload" });
          } catch { /* ignore */ }
        });
      },
    },
    {
      name: "vaultcss/vite:generate",

      async transform(code: string, id: string) {
        if (!vault || !isCss(id)) {
          return;
        }

        code = await vault.compiler(code);
        return { code };
      },
    },
  ] satisfies Plugin[];
}
