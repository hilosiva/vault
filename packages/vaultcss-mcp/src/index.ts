#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFileSync, readdirSync } from "fs";
import { join } from "path";

// ─── ブレークポイントのデフォルト値 ───────────────────────────────────────────
const DEFAULT_BREAKPOINTS: Record<string, string> = {
  "--xxs": "(width >= 375px)",
  "--xs": "(width >= 414px)",
  "--sm": "(width >= 600px)",
  "--md": "(width >= 768px)",
  "--lg": "(width >= 1024px)",
  "--xl": "(width >= 1280px)",
  "--xxl": "(width >= 1536px)",
};

// ─── 走査対象外ディレクトリ ────────────────────────────────────────────────────
const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  ".git",
  ".cache",
  ".vite",
  ".nuxt",
  ".output",
]);

// ─── vaultcss mediaqueries マーカー ───────────────────────────────────────────
const VAULT_MARKER = "/* @vaultcss mediaqueries */";

// ─── @custom-media をパース ────────────────────────────────────────────────────
function parseCustomMedia(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  const re = /@custom-media\s+(--[\w-]+)\s+([^;]+);/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    result[m[1]] = m[2].trim();
  }
  return result;
}

// ─── VAULT_MARKER を含む CSS ファイルを走査 ───────────────────────────────────
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

// ─── インストール済みパッケージ検出 ───────────────────────────────────────────
interface InstalledPackages {
  hasVaultcss: boolean;
  hasVaultscript: boolean;
  hasVitePlugin: boolean;
  hasFluid: boolean;
}

function detectInstalledPackages(cwd: string): InstalledPackages {
  // package.json が見つからない場合は全部 true（フォールバック）
  const fallback: InstalledPackages = {
    hasVaultcss: true,
    hasVaultscript: true,
    hasVitePlugin: true,
    hasFluid: true,
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
    const hasFluid = hasVaultcss || hasVitePlugin;
    return { hasVaultcss, hasVaultscript, hasVitePlugin, hasFluid };
  } catch {
    return fallback;
  }
}

// ─── MCPサーバー構築 ──────────────────────────────────────────────────────────
const server = new McpServer({
  name: "vaultcss-mcp",
  version: "0.1.0",
});

// ─── Resources ────────────────────────────────────────────────────────────────

const resourceSetup = server.resource(
  "vaultcss-setup",
  "vaultcss://setup",
  {
    description:
      "vaultcss / vite-plugin-vaultcss のセットアップ手順と注意点",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "vaultcss://setup",
        mimeType: "text/markdown",
        text: `# vaultcss セットアップガイド

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
`,
      },
    ],
  })
);

const resourceLayers = server.resource(
  "vaultcss-layers",
  "vaultcss://layers",
  {
    description:
      "vaultcss のレイヤー構成と各レイヤーへの書き分けガイド",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "vaultcss://layers",
        mimeType: "text/markdown",
        text: `# vaultcss レイヤー構成

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
`,
      },
    ],
  })
);

const resourceMediaQueriesGuide = server.resource(
  "vaultcss-media-queries-guide",
  "vaultcss://media-queries-guide",
  {
    description:
      "カスタムメディアクエリの使い方とデフォルトブレークポイント一覧",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "vaultcss://media-queries-guide",
        mimeType: "text/markdown",
        text: `# vaultcss カスタムメディアクエリガイド

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

## デフォルトブレークポイント

| 変数名 | 条件 | 想定デバイス |
|--------|------|-------------|
| \`--xxs\` | \`(width >= 375px)\` | iPhone SE 等 |
| \`--xs\`  | \`(width >= 414px)\` | iPhone Pro Max 等 |
| \`--sm\`  | \`(width >= 600px)\` | 大型スマートフォン |
| \`--md\`  | \`(width >= 768px)\` | タブレット縦 |
| \`--lg\`  | \`(width >= 1024px)\` | タブレット横・ノート PC |
| \`--xl\`  | \`(width >= 1280px)\` | デスクトップ |
| \`--xxl\` | \`(width >= 1536px)\` | 大型ディスプレイ |

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
`,
      },
    ],
  })
);

const resourceVitePlugin = server.resource(
  "vaultcss-vite-plugin",
  "vaultcss://vite-plugin",
  {
    description:
      "vite-plugin-vaultcss のオプション・設定方法リファレンス",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "vaultcss://vite-plugin",
        mimeType: "text/markdown",
        text: `# vite-plugin-vaultcss リファレンス

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
`,
      },
    ],
  })
);

const resourceFluid = server.resource(
  "vaultcss-fluid",
  "vaultcss://fluid",
  {
    description:
      "lightningcss-plugin-fluid の使い方。fluid() 関数で clamp() を自動生成するレスポンシブサイズ指定",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "vaultcss://fluid",
        mimeType: "text/markdown",
        text: `# vaultcss fluid ガイド

## 概要

\`fluid()\` 関数を CSS に書くと、自動で \`clamp()\` に変換されるプラグイン（lightningcss-plugin-fluid）。
ビューポート幅に応じてサイズが滑らかに変化するレスポンシブ指定を、シンプルな構文で記述できます。

\`\`\`css
/* 書く */
font-size: fluid(24px 40px);

/* コンパイル後 */
font-size: clamp(1.5rem, 1.25728rem + 1.0356vi, 2.5rem);
\`\`\`

## vite-plugin-vaultcss での設定

\`\`\`ts
// vite.config.ts
import { defineConfig } from "vite";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  plugins: [
    vaultcss({
      fluid: {
        minViewPort: 375,   // デフォルト: 375
        maxViewPort: 1920,  // デフォルト: 1920
        baseFontSize: 16,   // デフォルト: 16
        unit: "vi",         // "vi" | "vw" | "cqw" | "cqi"（デフォルト: "vi"）
      },
    }),
  ],
});
\`\`\`

## CSS での使い方

構文: \`fluid(最小値 最大値)\` または \`fluid(最小値 最大値 最小VP 最大VP)\`

- 最小値・最大値: \`px\` または \`rem\`（必須）
- 最小VP・最大VP: \`px\`（省略時はオプションの \`minViewPort\` / \`maxViewPort\` の値を使用）

\`\`\`css
/* シンプル（VP はオプション値を使用） */
font-size: fluid(24px 40px);

/* VP を個別に指定 */
font-size: fluid(24px 40px 768px 1024px);

/* rem 指定 */
margin-block: fluid(2.5rem 4rem);

/* 複数値（margin-block の start / end を個別指定） */
margin-block: fluid(2.5rem 4rem) fluid(24px 32px 768px 1024px);

/* CSS カスタムプロパティ（単位なし px 値として扱われる） */
:root {
  --font-sm: 14;
  --font-lg: 20;
}
font-size: fluid(var(--font-sm) var(--font-lg));
\`\`\`

## unit オプションの違い

| 値 | 基準 | 用途 |
|---|---|---|
| \`vi\` | インラインサイズ（論理プロパティ） | 通常はこれ（デフォルト） |
| \`vw\` | ビューポート幅 | 従来の書き方 |
| \`cqw\` | コンテナクエリ幅 | コンテナ内の要素 |
| \`cqi\` | コンテナクエリインライン | コンテナ内・論理プロパティ |

## fluidOptions 一覧

| オプション | 型 | デフォルト | 説明 |
|---|---|---|---|
| \`minViewPort\` | \`number\` | \`375\` | 最小ビューポート幅（px） |
| \`maxViewPort\` | \`number\` | \`1920\` | 最大ビューポート幅（px） |
| \`baseFontSize\` | \`number\` | \`16\` | rem 計算の基準フォントサイズ（px） |
| \`unit\` | \`"vi" \\| "vw" \\| "cqw" \\| "cqi"\` | \`"vi"\` | clamp の相対単位 |
`,
      },
    ],
  })
);

const resourceVaultscriptLibs = server.resource(
  "vaultscript-libs",
  "vaultscript://libs",
  {
    description:
      "vaultscript で使えるすべてのライブラリとユーティリティの一覧",
    mimeType: "text/markdown",
  },
  async () => ({
    contents: [
      {
        uri: "vaultscript://libs",
        mimeType: "text/markdown",
        text: `# vaultscript ライブラリ & ユーティリティ

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
`,
      },
    ],
  })
);

// ─── パッケージ検出 & Resource フィルタリング ─────────────────────────────────
// connect() より前に実行することで listResources / readResource 両方に反映される
const { hasVaultcss, hasVaultscript, hasVitePlugin, hasFluid } =
  detectInstalledPackages(process.cwd());

if (!hasVaultcss && !hasVitePlugin) resourceSetup.disable();
if (!hasVaultcss) resourceLayers.disable();
if (!hasVaultcss && !hasVitePlugin) resourceMediaQueriesGuide.disable();
if (!hasVitePlugin) resourceVitePlugin.disable();
if (!hasFluid) resourceFluid.disable();
if (!hasVaultscript) resourceVaultscriptLibs.disable();

// ─── Tools ────────────────────────────────────────────────────────────────────

server.tool(
  "get_breakpoints",
  "現在のプロジェクトの mediaqueries.css からブレークポイント定義を取得します。ファイルが見つからない場合はデフォルト値を返します。",
  {},
  async () => {
    const root = process.cwd();
    const found = findVaultMediaQueriesFile(root);

    if (!found) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                source: "default",
                message:
                  "mediaqueries.css が見つかりませんでした。デフォルトのブレークポイントを返します。vaultcss init を実行するか、/* @vaultcss mediaqueries */ マーカーを CSS ファイルに追加してください。",
                breakpoints: DEFAULT_BREAKPOINTS,
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
          type: "text" as const,
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

// ─── サーバー起動 ─────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
