# vite-plugin-vaultcss

> Unlock the Power of CSS

A Vite plugin that integrates [vaultcss](https://github.com/hilosiva/vault) into your Vite project — bringing automatic `@custom-media` injection, fluid typography via `fluid()`, and full HMR support.

## Features

- **Auto-detection of `mediaqueries.css`** — scans up to 3 levels deep from the project root and injects `@custom-media` definitions automatically
- **HMR support** — editing `mediaqueries.css` triggers a full reload to pick up the latest definitions
- **`fluid()` function** — converts `fluid(minSize maxSize)` shorthand into `clamp()` via [lightningcss-plugin-fluid](https://github.com/nickvdyck/lightningcss-plugin-fluid)
- **Override via config** — add or override `@custom-media` entries directly in `vite.config.ts`

## Requirements

- **Node.js**: 20.19.0 以上（22.12.0 以上推奨）
- **Vite**: 6.x または 7.x

| Peer Dependency | Version |
|-----------------|---------|
| `vaultcss` | `^0.3.0` |
| `vite` | `^6 \|\| ^7` |

## Installation

```bash
npm install -D vite-plugin-vaultcss vaultcss
# or
pnpm add -D vite-plugin-vaultcss vaultcss
```

## Setup

```ts
// vite.config.ts
import { defineConfig } from "vite";
import vaultcss from "vite-plugin-vaultcss";

export default defineConfig({
  plugins: [
    vaultcss({
      targets: "defaults",           // browserslist target (optional)
      fluid: {                       // fluid() options (optional)
        minViewPort: 375,
        maxViewPort: 1920,
        baseFontSize: 16,
        unit: "vi",
      },
      customMedia: {                 // add or override @custom-media (optional)
        "--sm": "(width >= 640px)",
      },
    }),
  ],
});
```

## Plugin Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `targets` | `string \| string[]` | `"defaults"` | [browserslist](https://browsersl.ist/) target string(s) |
| `fluid` | `FluidOptions` | — | Options for the `fluid()` function |
| `customMedia` | `Record<string, string>` | — | Additional or overriding `@custom-media` definitions (takes precedence over `mediaqueries.css`) |

### FluidOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `minViewPort` | `number` | `375` | Minimum viewport width in px |
| `maxViewPort` | `number` | `1920` | Maximum viewport width in px |
| `baseFontSize` | `number` | `16` | Base font size for rem calculations |
| `unit` | `"vi" \| "vw" \| "cqw" \| "cqi"` | `"vi"` | Relative unit used inside `clamp()` |

## `@custom-media` via `mediaqueries.css`

Place a CSS file containing the `/* @vaultcss mediaqueries */` marker anywhere within 3 directory levels of the project root. The plugin will detect it automatically and inject the defined `@custom-media` queries.

**Excluded directories:** `node_modules`, `dist`, `.git`, `.cache`, `.vite`, `.nuxt`, `.output`

```css
/* @vaultcss mediaqueries */
@custom-media --sm (width >= 36rem);
@custom-media --md (width >= 48rem);
@custom-media --lg (width >= 64rem);
```

Use the defined queries in your CSS:

```css
.example {
  font-size: 1rem;
}

@media (--md) {
  .example {
    font-size: 1.25rem;
  }
}
```

> **Note:** If you move `mediaqueries.css` to a different location, restart the dev server to re-trigger detection.

## `fluid()` Function

Use `fluid(minSize maxSize)` in any CSS property value. The plugin converts it to a `clamp()` expression at build time.

```css
/* Input */
font-size: fluid(24px 40px);
margin-block: fluid(2.5rem 4rem);

/* With explicit viewport range */
padding: fluid(16px 32px 768px 1024px);
```

The unit used inside `clamp()` is controlled by the `fluid.unit` option (`"vi"` by default).

## HMR Behavior

| Action | Result |
|--------|--------|
| Edit `mediaqueries.css` | Full page reload — updated `@custom-media` definitions are re-injected |
| Move `mediaqueries.css` | Dev server restart required |

## License

MIT &copy; [Shibata Hironori](https://github.com/hilosiva)
