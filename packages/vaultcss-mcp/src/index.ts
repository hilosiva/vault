#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------


const SETUP_GUIDE = `# vaultcss セットアップガイド

## 1. 初期化

\`\`\`bash
npx vaultcss init
\`\`\`

実行すると以下のファイルが展開されます：

- \`src/styles/tokens/mediaqueries.css\` — カスタムメディアクエリ定義
- \`src/styles/tokens/tokens.css\` — CSS カスタムプロパティ（変数）
- その他のベーススタイルファイル

## 2. Vite プラグインの設定

\`\`\`bash
pnpm add -D vite-plugin-vaultcss
\`\`\`

\`vite.config.ts\` に追加：

\`\`\`ts
import { defineConfig } from "vite";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  plugins: [
    vaultcss(),
  ],
  css: {
    transformer: "lightningcss",
  },
});
\`\`\`

## 重要ルール

### mediaqueries.css のマーカーコメント

\`mediaqueries.css\` の先頭に以下のマーカーコメントが必ず必要です：

\`\`\`css
/* @vaultcss mediaqueries */
\`\`\`

このマーカーがないと vite-plugin-vaultcss が自動検出できません。
\`vaultcss init\` で生成されたファイルには自動で付与されますが、
手動で作成した場合は忘れず追加してください。

### mediaqueries.css を移動した場合

ファイルの場所を変更したときは dev server の再起動が必要です。

\`\`\`bash
# dev server 再起動
Ctrl+C → pnpm dev
\`\`\`

## 走査ロジック

vite-plugin-vaultcss はプロジェクトルートから深さ3まで走査して
\`/* @vaultcss mediaqueries */\` マーカーを含む CSS ファイルを自動検出します。
以下のディレクトリは除外されます：

- \`node_modules\`
- \`dist\`
- \`.git\`
- \`.cache\`
- \`.vite\`
- \`.nuxt\`
- \`.output\`
`;

const LAYERS_GUIDE = `# vaultcss レイヤー構成

## レイヤー宣言

\`\`\`css
@layer tokens, reset, base, vendors, components, utilities;
\`\`\`

## 各レイヤーの役割

### \`tokens\`
CSS カスタムプロパティ（変数）と \`@custom-media\` の定義。
デザイントークン（色・スペーシング・フォントサイズ等）はここに集約します。

\`\`\`css
@layer tokens {
  :root {
    --color-primary: #3b82f6;
    --spacing-4: 1rem;
  }
}
\`\`\`

### \`reset\`
ブラウザのデフォルトスタイルをリセットします。
基本的には vaultcss が提供するリセットをそのまま使用してください。

### \`base\`
\`html\` / \`body\` / 見出し（\`h1\`〜\`h6\`）/ リンク（\`a\`）等の基本スタイル。
タグセレクタで記述します。クラスは原則使いません。

\`\`\`css
@layer base {
  body {
    font-family: var(--font-family-base);
    color: var(--color-text);
  }
}
\`\`\`

### \`vendors\`
サードパーティライブラリ（Swiper・Splide 等）のスタイル上書き。
ライブラリ由来のクラスに対して調整を加える場合はここに書きます。

### \`components\`
再利用可能な UI パーツ（ボタン・カード・モーダル・ナビゲーション等）。
BEM やコンポーネント名ベースのクラスを使用します。

\`\`\`css
@layer components {
  .c-button {
    display: inline-flex;
    padding: var(--spacing-2) var(--spacing-4);
  }
}
\`\`\`

### \`utilities\`
単一責務のユーティリティクラス。カスケードの最上位に位置するため、
他のレイヤーのスタイルを上書きできます。

\`\`\`css
@layer utilities {
  .u-sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }
}
\`\`\`

## レイヤーの優先順位

宣言順が後ろのレイヤーほど優先度が高くなります。

\`tokens\` < \`reset\` < \`base\` < \`vendors\` < \`components\` < \`utilities\`

同一レイヤー内では通常のカスケードルール（詳細度・記述順）が適用されます。
`;

const MEDIA_QUERIES_GUIDE = `# vaultcss カスタムメディアクエリガイド

## 構文

\`\`\`css
/* ネイティブ CSS では未対応 — LightningCSS がコンパイル時に変換 */
@media (--md) {
  .example {
    font-size: 1.25rem;
  }
}
\`\`\`

ビルド後は通常の \`@media\` に展開されます：

\`\`\`css
@media (width >= 768px) {
  .example {
    font-size: 1.25rem;
  }
}
\`\`\`

## \`vaultcss init\` で生成されるブレークポイント

vaultcss にハードコードされたデフォルトはありません。
\`vaultcss init\` を実行すると \`tokens/mediaqueries.css\` が次の内容で生成されます：

| 変数名 | 条件 | 想定デバイス |
|--------|------|-------------|
| \`--xxs\` | \`(width >= 23.4375rem)\` | iPhone SE 等 |
| \`--xs\`  | \`(width >= 25rem)\` | iPhone Pro Max 等 |
| \`--sm\`  | \`(width >= 36rem)\` | 大型スマートフォン |
| \`--md\`  | \`(width >= 48rem)\` | タブレット縦 |
| \`--lg\`  | \`(width >= 64rem)\` | タブレット横・ノート PC |
| \`--xl\`  | \`(width >= 80rem)\` | デスクトップ |
| \`--xxl\` | \`(width >= 96rem)\` | 大型ディスプレイ |

このファイルが存在しない場合、vite-plugin-vaultcss はメディアクエリなしで動作します。


## カスタマイズ

\`mediaqueries.css\` を直接編集することでブレークポイントをカスタマイズできます。

\`\`\`css
/* @vaultcss mediaqueries */

@custom-media --sm (width >= 640px);
@custom-media --md (width >= 800px);
@custom-media --lg (width >= 1100px);
\`\`\`

**注意**: ファイル編集後は dev server の再起動が必要です。

## \`@custom-media\` の定義場所

\`mediaqueries.css\` は \`@layer tokens\` の外（レイヤーなし）に記述します。
\`@custom-media\` はレイヤーと独立したスコープで動作するためです。

\`\`\`css
/* @vaultcss mediaqueries */

/* ← @layer の外に定義する */
@custom-media --md (width >= 768px);
\`\`\`
`;

const VITE_PLUGIN_GUIDE = `# vite-plugin-vaultcss リファレンス

## 基本設定

\`\`\`ts
// vite.config.ts
import { defineConfig } from "vite";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  plugins: [vaultcss(options)],
});
\`\`\`

## PluginOptions（すべて任意）

| オプション | 型 | 説明 |
|---|---|---|
| \`targets\` | \`string \\| string[]\` | browserslist のターゲット指定。省略時は \`"defaults"\` |
| \`fluid\` | \`fluidOptions\` | lightningcss-plugin-fluid のオプション |
| \`customMedia\` | \`Record<string, string>\` | 追加・上書きするカスタムメディアクエリ。\`mediaqueries.css\` より優先される |

### targets

\`\`\`ts
vaultcss({
  targets: "last 2 versions, not dead",
})
// または配列で指定
vaultcss({
  targets: ["> 0.5%", "last 2 versions", "not dead"],
})
\`\`\`

### customMedia

プロジェクトの \`mediaqueries.css\` に加えて、オプションで定義を追加・上書きできます。
\`customMedia\` オプションの値が \`mediaqueries.css\` の定義より優先されます。

\`\`\`ts
vaultcss({
  customMedia: {
    "--sm": "(width >= 640px)",
    "--md": "(width >= 800px)",
    "--touch": "(hover: none) and (pointer: coarse)",
  },
})
\`\`\`

## 自動検出の仕組み

1. プロジェクトルートから深さ3まで CSS ファイルを走査します
2. \`/* @vaultcss mediaqueries */\` マーカーコメントを含むファイルを \`mediaqueries.css\` として認識します
3. 検出結果に応じて動作が変わります：

| 状況 | 動作 |
|------|------|
| ファイルが見つかった | そのファイルの \`@custom-media\` 定義を使用（\`customMedia\` オプションで上書き可能） |
| ファイルが見つからない | メディアクエリなしで動作（\`customMedia\` オプションで手動指定可能） |

走査から除外されるディレクトリ: \`node_modules\` / \`dist\` / \`.git\` / \`.cache\` / \`.vite\` / \`.nuxt\` / \`.output\`

## HMR 対応

- \`mediaqueries.css\` を編集すると \`@custom-media\` 定義が再読み込みされ、ブラウザが自動フルリロードします
- ファイルを別の場所に移動した場合は dev server の再起動が必要です

\`\`\`bash
# dev server 再起動
Ctrl+C → pnpm dev
\`\`\`
`;

const FLUID_GUIDE = `# vaultcss fluid 設定ガイド

## 概要

\`fluid()\` / \`fluid-free()\` 関数を CSS に書くと自動で \`clamp()\` / \`max()\` に変換されます（lightningcss-plugin-fluid）。
構文・引数・unit の詳細は \`lightningcss-plugins-mcp\` の \`get_fluid_functions\` を参照してください。

## vite-plugin-vaultcss での設定（vite.config.ts）

\`\`\`ts
import { defineConfig } from "vite";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  plugins: [
    vaultcss({
      fluid: {
        minViewPort: 375,   // デフォルト: 375
        maxViewPort: 1920,  // デフォルト: 1920
        baseFontSize: 16,   // デフォルト: 16
        unit: "vi",         // "vi" | "vw" | "vh" | "vb" | "cqw" | "cqi"（デフォルト: "vi"）
      },
    }),
  ],
});
\`\`\`

## astro.config.ts での設定

\`\`\`ts
import { defineConfig } from "astro/config";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  vite: {
    plugins: [
      vaultcss({
        fluid: {
          minViewPort: 375,
          maxViewPort: 1920,
          unit: "vi",
        },
      }),
    ],
  },
});
\`\`\`

## fluidOptions 一覧

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| \`minViewPort\` | \`number\` | \`375\` | 最小ビューポート幅（px） |
| \`maxViewPort\` | \`number\` | \`1920\` | 最大ビューポート幅（px） |
| \`baseFontSize\` | \`number\` | \`16\` | rem 計算の基準フォントサイズ（px） |
| \`unit\` | \`"vi" \\| "vw" \\| "vh" \\| "vb" \\| "cqw" \\| "cqi"\` | \`"vi"\` | clamp の相対単位 |
`;

const VAULTSCRIPT_LIBS_GUIDE = `# vaultscript ライブラリ & ユーティリティ

すべて \`import { ... } from "vaultscript"\` でインポートできます。

## Libs（ライブラリ）

### \`Loading\`
ページライフサイクル管理。ローディングアニメーション・viewport 設定・
iOS 検出・ページ遷移をまとめて管理します。

\`\`\`ts
import { Loading } from "vaultscript";

const loading = new Loading();
loading.init();
\`\`\`

### \`MomentumScroll\`
Lenis をラップした慣性スクロール。
\`prefers-reduced-motion\` に自動対応し、ユーザー設定を尊重します。

\`\`\`ts
import { MomentumScroll } from "vaultscript";

const scroll = new MomentumScroll();
scroll.init();
\`\`\`

### \`Toggle\` / \`ToggleButton\`
\`aria-expanded\` ベースのアクセシブルなトグル実装。
ハンバーガーメニュー・アコーディオン等に使用します。

\`\`\`ts
import { Toggle, ToggleButton } from "vaultscript";

const toggle = new Toggle({ target: "#menu" });
const btn = new ToggleButton({ control: toggle });
\`\`\`

### \`ModalDialog\` (\`createModal\`)
CSS アニメーション完了を待つモーダルダイアログ Web Component。
\`<dialog>\` 要素をベースにアクセシブルなモーダルを実装します。

\`\`\`ts
import { createModal } from "vaultscript";

// カスタム要素として登録
createModal();
\`\`\`

\`\`\`html
<vault-modal id="my-modal">
  <button slot="trigger">開く</button>
  <p>モーダルの内容</p>
</vault-modal>
\`\`\`

### \`invokerPolyfill\`
Invoker Commands API のポリフィル。
\`commandfor\` / \`command\` / \`closedby\` 属性に対応します。

\`\`\`ts
import { invokerPolyfill } from "vaultscript";

invokerPolyfill();
\`\`\`

## Utils（ユーティリティ）

### \`animationFinished\`
CSS アニメーション完了を Promise で待ちます。

\`\`\`ts
import { animationFinished } from "vaultscript";

await animationFinished(element);
\`\`\`

### \`debounce\`
関数の呼び出しを間引きます（デバウンス処理）。

\`\`\`ts
import { debounce } from "vaultscript";

const handler = debounce(() => {
  console.log("resize");
}, 200);
window.addEventListener("resize", handler);
\`\`\`

### \`deepMerge\`
オブジェクトをディープマージします。

\`\`\`ts
import { deepMerge } from "vaultscript";

const merged = deepMerge(defaultOptions, userOptions);
\`\`\`

### \`spanWrap\`
テキストの各文字を \`<span>\` で囲みます。
文字アニメーション実装時に使用します。

\`\`\`ts
import { spanWrap } from "vaultscript";

spanWrap(element); // "Hello" → <span>H</span><span>e</span>...
\`\`\`

### \`sanitizeHtml\`
DOMPurify を使った HTML サニタイズ。SSR 環境にも対応しています。

\`\`\`ts
import { sanitizeHtml } from "vaultscript";

const safe = sanitizeHtml(userInput);
element.innerHTML = safe;
\`\`\`
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".cache",
  ".vite",
  ".nuxt",
  ".output",
]);

const VAULT_MARKER = "/* @vaultcss mediaqueries */";

function parseCustomMedia(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /@custom-media\s+(--[\w-]+)\s+([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = m[2].trim();
  }
  return result;
}

function findVaultMediaQueriesFile(
  root: string
): { path: string; queries: Record<string, string> } | null {
  function scan(
    dir: string,
    depth: number
  ): { path: string; content: string } | null {
    if (depth > 3) return null;
    let entries: ReturnType<typeof readdirSync>;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      if (entry.isFile() && entry.name.endsWith(".css")) {
        const filePath = join(dir, entry.name);
        try {
          const content = readFileSync(filePath, "utf-8");
          if (content.includes(VAULT_MARKER)) return { path: filePath, content };
        } catch {
          continue;
        }
      }
      if (entry.isDirectory()) {
        const result = scan(join(dir, entry.name), depth + 1);
        if (result) return result;
      }
    }
    return null;
  }
  const found = scan(root, 0);
  if (!found) return null;
  return { path: found.path, queries: parseCustomMedia(found.content) };
}

interface InstalledPackages {
  hasVaultcss: boolean;
  hasVaultscript: boolean;
  hasVitePlugin: boolean;
}

function detectInstalledPackages(cwd: string): InstalledPackages {
  const fallback: InstalledPackages = {
    hasVaultcss: true,
    hasVaultscript: true,
    hasVitePlugin: true,
  };
  try {
    const raw = readFileSync(join(cwd, "package.json"), "utf-8");
    const pkg = JSON.parse(raw) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasVaultcss = "vaultcss" in deps;
    const hasVaultscript = "vaultscript" in deps;
    const hasVitePlugin = "vite-plugin-vaultcss" in deps;
    // vault 系が1つも見つからない場合はフォールバック（全部 true）
    if (!hasVaultcss && !hasVaultscript && !hasVitePlugin) return fallback;
    return { hasVaultcss, hasVaultscript, hasVitePlugin };
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// MCP Server
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "vaultcss-mcp",
  version: "0.1.3",
});

const TOOL_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

// ---------------------------------------------------------------------------
// Package detection & conditional tool registration
// ---------------------------------------------------------------------------

const { hasVaultcss, hasVaultscript, hasVitePlugin } = detectInstalledPackages(
  process.cwd()
);
const hasFluid = hasVaultcss || hasVitePlugin;

if (hasVaultcss || hasVitePlugin) {
  server.registerTool(
    "get_setup",
    {
      description:
        "vaultcss / vite-plugin-vaultcss のセットアップ手順と注意点を返します",
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS,
    },
    async () => ({
      content: [{ type: "text", text: SETUP_GUIDE }],
    })
  );

  server.registerTool(
    "get_media_queries_guide",
    {
      description:
        "vaultcss のカスタムメディアクエリの使い方を返します。@custom-media 構文・デフォルトブレークポイント一覧・カスタマイズ方法を含みます",
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS,
    },
    async () => ({
      content: [{ type: "text", text: MEDIA_QUERIES_GUIDE }],
    })
  );
}

if (hasVaultcss) {
  server.registerTool(
    "get_layers",
    {
      description:
        "vaultcss のレイヤー構成（tokens/reset/base/vendors/components/utilities）と各レイヤーの役割・書き分けガイドを返します",
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS,
    },
    async () => ({
      content: [{ type: "text", text: LAYERS_GUIDE }],
    })
  );
}

if (hasVitePlugin) {
  server.registerTool(
    "get_vite_plugin",
    {
      description:
        "vite-plugin-vaultcss のオプション・設定方法・mediaqueries.css 自動検出の仕組みを返します",
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS,
    },
    async () => ({
      content: [{ type: "text", text: VITE_PLUGIN_GUIDE }],
    })
  );
}

if (hasFluid) {
  server.registerTool(
    "get_fluid_guide",
    {
      description:
        "vaultcss の fluid() 関数の使い方を返します。CSS の clamp() に自動変換されるレスポンシブサイジング機能です",
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS,
    },
    async () => ({
      content: [{ type: "text", text: FLUID_GUIDE }],
    })
  );
}

if (hasVaultscript) {
  server.registerTool(
    "get_vaultscript_libs",
    {
      description:
        "vaultscript で使えるライブラリとユーティリティの一覧・使い方を返します",
      inputSchema: {},
      annotations: TOOL_ANNOTATIONS,
    },
    async () => ({
      content: [{ type: "text", text: VAULTSCRIPT_LIBS_GUIDE }],
    })
  );
}

// get_breakpoints は常に登録
server.registerTool(
  "get_breakpoints",
  {
    description:
      "現在のプロジェクトの mediaqueries.css からブレークポイント定義を取得します。ファイルが見つからない場合はデフォルト値を返します。",
    inputSchema: {},
    annotations: TOOL_ANNOTATIONS,
  },
  async () => {
    const root = process.cwd();
    const found = findVaultMediaQueriesFile(root);

    if (!found) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                source: "none",
                message:
                  "mediaqueries.css が見つかりませんでした。vite-plugin-vaultcss はメディアクエリなしで動作します。ブレークポイントを使うには vaultcss init を実行するか、/* @vaultcss mediaqueries */ マーカーを含む CSS ファイルを作成してください。",
                breakpoints: {},
              },
              null,
              2
            ),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              source: "project",
              file: found.path,
              breakpoints: found.queries,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("vaultcss-mcp server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
