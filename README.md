# Vault

> Unlock the Power of the Web

A monorepo of CSS and JavaScript packages for modern web development, powered by [LightningCSS](https://lightningcss.dev/).

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`vaultcss`](./packages/vaultcss) | `0.3.1` | CSS compiler, CLI, and layered stylesheet collection |
| [`vite-plugin-vaultcss`](./packages/@vaultcss-vite) | `0.3.1` | Vite plugin integrating vaultcss with HMR and `fluid()` support |
| [`vaultscript`](./packages/vaultscript) | `0.2.4` | UI component library — modals, smooth scroll, toggles, and more |
| [`vaultcss-mcp`](./packages/vaultcss-mcp) | `0.1.2` | MCP server that brings vaultcss docs into Claude Code and Cursor |

---

## Quick Start

### 1. Install

```bash
pnpm add vaultcss vaultscript
pnpm add -D vite-plugin-vaultcss
```

### 2. Scaffold CSS files

```bash
npx vaultcss init
```

Generates a layered CSS structure under `src/styles/`, including `tokens/mediaqueries.css` with the `/* @vaultcss mediaqueries */` marker.

### 3. Configure Vite

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  plugins: [vaultcss()],
});
```

### 4. Enable AI editor support (optional)

Add `.mcp.json` to your project root:

```json
{
  "mcpServers": {
    "vaultcss": {
      "command": "npx",
      "args": ["-y", "vaultcss-mcp"]
    }
  }
}
```

---

## vaultcss

A CSS compiler and layered stylesheet collection.

**Layer architecture:**

```css
@layer tokens, reset, base, vendors, components, utilities;
```

**`fluid()` → `clamp()` conversion:**

```css
font-size: fluid(24px 40px);
/* → clamp(1.5rem, 1.26rem + 1.04vi, 2.5rem) */
```

→ [Full documentation](./packages/vaultcss/README.md)

---

## vite-plugin-vaultcss

Integrates vaultcss into Vite with zero boilerplate.

- Automatically detects `mediaqueries.css` via the `/* @vaultcss mediaqueries */` marker (scans up to 3 levels deep)
- HMR: editing `mediaqueries.css` triggers a full reload with updated `@custom-media` definitions
- No default breakpoints — define your own in `mediaqueries.css` or via the `customMedia` option

**`@custom-media` usage:**

```css
/* tokens/mediaqueries.css */
/* @vaultcss mediaqueries */
@custom-media --md (width >= 48rem);
@custom-media --lg (width >= 64rem);
```

```css
/* In any CSS file */
@media (--md) {
  .example { font-size: 1.25rem; }
}
```

→ [Full documentation](./packages/@vaultcss-vite/README.md)

---

## vaultscript

A UI component library for modern web projects.

- `Loading` — page lifecycle, loading animations, iOS detection
- `MomentumScroll` — Lenis-based smooth scroll with `prefers-reduced-motion` support
- `Toggle` / `ToggleButton` — accessible `aria-expanded` toggles
- `ModalDialog` — Web Component modal with CSS animation support
- `invokerPolyfill` — Invoker Commands API polyfill
- Utils: `animationFinished`, `debounce`, `deepMerge`, `spanWrap`, `sanitizeHtml`

```ts
import { Loading, MomentumScroll, Toggle } from "vaultscript";
```

→ [Full documentation](./packages/vaultscript/README.md)

---

## vaultcss-mcp

An MCP server that provides vaultcss documentation as tools inside Claude Code, Cursor, and any MCP-compatible AI editor.

Registers only the tools that match the packages installed in your project:

| Tool | Description |
|------|-------------|
| `get_setup` | Setup steps and file structure |
| `get_layers` | Layer architecture reference |
| `get_media_queries_guide` | `@custom-media` syntax and customization |
| `get_vite_plugin` | Vite plugin options reference |
| `get_fluid_guide` | `fluid()` function usage |
| `get_vaultscript_libs` | Library and utility catalogue |
| `get_breakpoints` | Current project breakpoints from `mediaqueries.css` |

→ [Full documentation](./packages/vaultcss-mcp/README.md)

---

## License

MIT © Shibata Hironori
