#!/usr/bin/env node

import { input, select, checkbox } from "@inquirer/prompts";
import { existsSync, readFileSync, readdirSync, mkdirSync, copyFileSync, writeFileSync } from "fs";
import { join, dirname, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { bold, cyan, green, red, yellow } from "kolorist";
import ora from "ora";

const __dirname = dirname(fileURLToPath(import.meta.url));

// package.json からバージョンを取得
const pkg = JSON.parse(readFileSync(join(__dirname, "../package.json"), "utf-8"));
const VERSION: string = pkg.version ?? "0.0.0";

// vaultcss の dist ディレクトリ（cli.mjs と同じ場所 = dist/）
const DIST_DIR = __dirname;

// よくあるスタイルディレクトリ名
const STYLE_DIR_NAMES = new Set(["styles", "css", "scss", "sass", "style"]);

// よくあるエントリーCSSファイル名
const ENTRY_FILE_NAMES = ["global.css", "index.css", "style.css", "app.css", "main.css"];

// 走査対象外
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", ".cache"]);


// ----------------------------------------------------------------
// バナー
// ----------------------------------------------------------------

function printBanner(): void {
  console.log();
  console.log(bold(cyan("  ██╗   ██╗ █████╗ ██╗   ██╗██╗  ████████╗ ██████╗███████╗███████╗")));
  console.log(bold(cyan("  ██║   ██║██╔══██╗██║   ██║██║  ╚══██╔══╝██╔════╝██╔════╝██╔════╝")));
  console.log(bold(cyan("  ██║   ██║███████║██║   ██║██║     ██║   ██║     ███████╗███████╗")));
  console.log(bold(cyan("  ╚██╗ ██╔╝██╔══██║██║   ██║██║     ██║   ██║     ╚════██╗╚════██╗")));
  console.log(bold(cyan("   ╚████╔╝ ██║  ██║╚██████╔╝███████╗██║   ╚██████╗███████║███████║")));
  console.log(bold(cyan("    ╚═══╝  ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═════╝╚══════╝╚══════╝")));
  console.log();
  console.log(`  v${VERSION}  スタイルをプロジェクトに展開します。`);
  console.log();
}

// ----------------------------------------------------------------
// ユーティリティ
// ----------------------------------------------------------------

function findStyleDirs(root: string): string[] {
  const results: string[] = [];
  function scan(dir: string, depth: number) {
    if (depth > 3) return;
    let entries: ReturnType<typeof readdirSync>;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORE_DIRS.has(entry.name)) continue;
      const full = join(dir, entry.name);
      if (STYLE_DIR_NAMES.has(entry.name)) results.push(relative(root, full));
      scan(full, depth + 1);
    }
  }
  scan(root, 0);
  return results;
}

function findEntryFile(dir: string): string | null {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir);
  return ENTRY_FILE_NAMES.find((name) => files.includes(name)) ?? null;
}

interface LayerInfo { name: string; files: string[]; }

// index.css の @layer 宣言から正しい順序を取得
function getLayerOrder(): string[] {
  const indexCss = join(DIST_DIR, "index.css");
  if (!existsSync(indexCss)) return [];
  const content = readFileSync(indexCss, "utf-8");
  const m = content.match(/@layer\s+([^;]+);/);
  return m ? m[1].split(",").map((s) => s.trim()) : [];
}

// index.css の @import からファイル順を取得
function getFileOrder(layerName: string): string[] {
  const indexCss = join(DIST_DIR, "index.css");
  if (!existsSync(indexCss)) return [];
  const content = readFileSync(indexCss, "utf-8");
  const re = new RegExp(`@import\\s+"\\./[^/]+/([^"]+)"\\s+layer\\(${layerName}\\)`, "g");
  const files: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) files.push(m[1]);
  return files;
}

// dist/ を走査してレイヤー情報を取得（index.css の順序でソート）
function scanLayers(): LayerInfo[] {
  const order = getLayerOrder();
  const dirs = readdirSync(DIST_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);

  return order
    .filter((name) => dirs.includes(name))
    .map((name) => {
      // index.css で定義されたファイル順を優先、なければディレクトリから取得
      const orderedFiles = getFileOrder(name);
      const dirFiles = readdirSync(join(DIST_DIR, name)).filter((f) => f.endsWith(".css"));
      const files = orderedFiles.length > 0 ? orderedFiles : dirFiles;
      return { name, files };
    });
}

function buildImports(selected: Map<string, string[]>): string {
  const lines: string[] = [`@layer ${[...selected.keys()].join(", ")};`];
  for (const [name, files] of selected) {
    if (files.length === 0) continue;
    lines.push(`\n/* ${name.charAt(0).toUpperCase() + name.slice(1)} */`);
    for (const file of files) {
      lines.push(`@import "./${name}/${file}" layer(${name});`);
    }
  }
  return lines.join("\n");
}

// ----------------------------------------------------------------
// メイン
// ----------------------------------------------------------------

async function main(): Promise<void> {
  printBanner();

  const rawArgs = process.argv.slice(2);
  const yes = rawArgs.includes("--yes") || rawArgs.includes("-y");

  const cwd = process.cwd();
  const foundDirs = findStyleDirs(cwd);

  // 1. 出力先
  const outDirRaw = yes
    ? (foundDirs[0] ?? "src/styles")
    : await input({
        message: "スタイルの出力先:",
        default: foundDirs[0] ?? "src/styles",
      });
  const outDir = resolve(cwd, outDirRaw);

  // 2. エントリーファイル名
  const detectedEntry = findEntryFile(outDir);
  const entryFile = yes
    ? (detectedEntry ?? "global.css")
    : await input({
        message: "エントリーCSSファイル名:",
        default: detectedEntry ?? "global.css",
      });

  // 3. レイヤーを走査
  const layers = scanLayers();
  if (layers.length === 0) {
    console.error(red("\nエラー: スタイルが見つかりませんでした。\n"));
    process.exit(1);
  }

  // 4. 全部 or 個別
  const selected = new Map<string, string[]>();

  if (yes) {
    // --yes: 全レイヤーを選択
    for (const layer of layers) selected.set(layer.name, layer.files);
  } else {
    const installMode = await select({
      message: "インストールするスタイルは？:",
      choices: [
        { name: "全部", value: "all" },
        { name: "個別に選ぶ", value: "select" },
      ],
    });

    if (installMode === "all") {
      for (const layer of layers) selected.set(layer.name, layer.files);
    } else {
      // レイヤー選択
      const layerNames = await checkbox({
        message: "含めるレイヤーを選択 (スペースで選択・Enter で確定):",
        choices: layers.map((l) => ({
          name: l.files.length === 0
            ? `${l.name}  (レイヤー定義のみ)`
            : l.files.length === 1
              ? `${l.name}  (${l.files[0]})`
              : `${l.name}  (${l.files.length} files)`,
          value: l.name,
          checked: false,
        })),
      });

      // 複数ファイルのレイヤーはさらに個別選択
      for (const name of layerNames) {
        const layer = layers.find((l) => l.name === name)!;
        if (layer.files.length <= 1) {
          selected.set(name, layer.files);
        } else {
          const files = await checkbox({
            message: `${name} のファイルを選択 (スペースで選択・Enter で確定):`,
            choices: layer.files.map((f) => ({
              name: f,
              value: f,
              checked: false,
            })),
          });
          if (files.length > 0) selected.set(name, files);
        }
      }
    }
  }

  // 5. 既存ファイルを確認（エントリーCSS・mediaqueries.css も含む）
  const css = buildImports(selected);
  const entryPath = join(outDir, entryFile);
  const mediaqueriesSrc = join(DIST_DIR, "mediaqueries.css");
  const mediaqueriesDest = join(outDir, "tokens", "mediaqueries.css");
  const hasMediaqueries = existsSync(mediaqueriesSrc);

  const conflictFiles: string[] = [];
  for (const [name, files] of selected) {
    for (const file of files) {
      if (existsSync(join(outDir, name, file))) conflictFiles.push(`${name}/${file}`);
    }
  }
  if (hasMediaqueries && existsSync(mediaqueriesDest)) conflictFiles.push("tokens/mediaqueries.css");
  if (existsSync(entryPath)) conflictFiles.push(entryFile);

  // --yes の場合は常に上書き
  let overwriteMode: "overwrite" | "skip" | "cancel" = "overwrite";
  if (!yes && conflictFiles.length > 0) {
    console.log(`\n${yellow("以下のファイルはすでに存在します:")}`);
    conflictFiles.forEach((f) => console.log(`  ${f}`));
    console.log();
    overwriteMode = await select({
      message: "どうしますか？:",
      choices: [
        { name: "上書きする（既存ファイルを置き換える）", value: "overwrite" },
        { name: "新規のみコピーする（既存ファイルはそのまま）", value: "skip" },
        { name: "キャンセル", value: "cancel" },
      ],
    }) as "overwrite" | "skip" | "cancel";
    if (overwriteMode === "cancel") {
      console.log("\nキャンセルしました\n");
      process.exit(0);
    }
  }

  // 6. ファイルをコピー
  const spinner = ora({ color: "cyan" }).start("コピー中...");
  for (const [name, files] of selected) {
    const destDir = join(outDir, name);
    mkdirSync(destDir, { recursive: true });
    for (const file of files) {
      const dest = join(destDir, file);
      if (overwriteMode === "skip" && existsSync(dest)) continue;
      copyFileSync(join(DIST_DIR, name, file), dest);
    }
  }
  // mediaqueries.css をコピー（tokens/ に配置）
  if (hasMediaqueries) {
    if (!(overwriteMode === "skip" && existsSync(mediaqueriesDest))) {
      mkdirSync(join(outDir, "tokens"), { recursive: true });
      copyFileSync(mediaqueriesSrc, mediaqueriesDest);
    }
  }
  // 7. エントリーCSS の生成
  mkdirSync(outDir, { recursive: true });
  if (overwriteMode === "skip" && existsSync(entryPath)) {
    spinner.stop();
    console.log(`\n以下を ${yellow(entryFile)} にコピーしてください:\n\n${css}\n`);
  } else {
    writeFileSync(entryPath, css);
  }

  const doneMessage = overwriteMode === "skip"
    ? green("新規ファイルを展開しました（既存ファイルはそのまま）")
    : green("すべてのファイルを展開しました");
  spinner.succeed(doneMessage);

  console.log();
  console.log("  展開先:", bold(cyan(outDirRaw)));
  console.log();
}

main().catch((err) => {
  console.error(red("\n予期しないエラーが発生しました:"), err);
  process.exit(1);
});
