# vaultcss

> Unlock the Power of CSS

A CSS compiler, CLI, and layered stylesheet collection powered by [LightningCSS](https://lightningcss.dev/).

```bash
npm install vaultcss
# or
pnpm add vaultcss
```

---

## Features

- **LightningCSS compiler** — transforms modern CSS for your target browsers
- **`fluid()` → `clamp()` conversion** — fluid typography and spacing via [lightningcss-plugin-fluid](https://github.com/nicholasgasior/lightningcss-plugin-fluid)
- **`@custom-media` expansion** — draft spec resolved at compile time
- **Layered stylesheets** — ready-to-use CSS files structured around `@layer`
- **`vaultcss init` CLI** — scaffolds a layer-based CSS file structure into your project

---

## CLI

Run the initializer to scaffold CSS files under `src/styles/`:

```bash
npx vaultcss init
```

The generated structure follows the layer architecture below. `tokens/mediaqueries.css` includes a `/* @vaultcss mediaqueries */` marker so tools can locate and inject custom media queries.

---

## Layer Architecture

```css
@layer tokens, reset, base, vendors, components, utilities;
```

| Layer | Purpose |
|-------|---------|
| `tokens` | CSS custom properties and `@custom-media` definitions |
| `reset` | Browser reset based on [@hilosiva/oreset](https://github.com/hilosiva/oreset) |
| `base` | Tag-level styles for `html`, `body`, `h1`–`h6`, `a` |
| `vendors` | Third-party style overrides |
| `components` | Reusable UI parts (container, grid, spacer) |
| `utilities` | Single-responsibility classes — highest specificity |

---

## Stylesheet Exports

Import individual layers or the full bundle:

```css
/* Full bundle */
@import "vaultcss/index.css";

/* Individual layers */
@import "vaultcss/mediaqueries.css";
@import "vaultcss/tokens/tokens.css";
@import "vaultcss/reset/reset.css";
@import "vaultcss/base/html.css";
@import "vaultcss/base/a.css";
@import "vaultcss/base/hn.css";
@import "vaultcss/components/container.css";
@import "vaultcss/components/grid.css";
@import "vaultcss/components/spacer.css";
@import "vaultcss/utilities/utilities.css";
```

---

## JS / TypeScript API

```ts
import { VaultCss } from "vaultcss";

const vault = new VaultCss({
  targets: "defaults",   // browserslist query
  minify: false,
  fluid: { /* lightningcss-plugin-fluid options */ },
  customMedia: {
    "--sm": "(min-width: 640px)",
    "--lg": "(min-width: 1024px)",
  },
});

// Synchronous — returns an optimized CSS string
const output = vault.optimize(css);

// Asynchronous — returns a Prettier-formatted CSS string
const formatted = await vault.compiler(css);
```

### `PluginOptions`

| Option | Type | Description |
|--------|------|-------------|
| `targets` | `string \| string[]` | [browserslist](https://browsersl.ist/) query. Defaults to `"defaults"` |
| `fluid` | `fluidOptions` | Options passed to `lightningcss-plugin-fluid` |
| `minify` | `boolean` | Minify output. Default: `false` |
| `customMedia` | `Record<string, string>` | Additional or overriding `@custom-media` definitions |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `optimize(css, options?)` | `string` | Synchronously compiles and transforms CSS |
| `compiler(css)` | `Promise<string>` | Compiles CSS, then formats with Prettier |

---

## Vite Integration

For Vite projects, pair vaultcss with [`vite-plugin-vaultcss`](https://github.com/hilosiva/vault) for seamless build integration. vaultcss itself works as a standalone LightningCSS wrapper in any build pipeline.

---

## License

MIT © Shibata Hironori
