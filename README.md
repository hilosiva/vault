# Vault

俺のフレキシブル CSS フレームワーク (Ore no Flexible CSS Framework)

A modern, flexible CSS framework built with LightningCSS for ultra-fast processing and cutting-edge CSS features.

## Packages

### 🎨 [vaultcss](./packages/vaultcss) 
**Core CSS Framework**
- ⚡️ **LightningCSS Processing** - Rust-powered, 100x faster than JS alternatives
- 📱 **Custom Media Queries** - Built-in responsive breakpoints with full override support
- 🌊 **Fluid Typography** - `fluid()` function for responsive scaling
- 🎯 **Modern CSS Support** - Container Queries, CSS Nesting, Custom Properties
- 🔧 **Configurable** - Customize breakpoints programmatically or in files

### ⚡️ [vite-plugin-vaultcss](./packages/@vaultcss-vite)
**Vite Integration Plugin**
- 🚀 **Seamless Integration** - Works with any Vite-based project (Astro, Vue, React, etc.)
- 🎯 **Perfect Compatibility** - No conflicts with TailwindCSS or other CSS frameworks
- 📦 **Zero Configuration** - Works out of the box with sensible defaults
- 🔥 **Hot Reload** - Full HMR support for development

### 🎭 [vaultscript](./packages/vaultscript)
**Interactive Components Library**
- 🪟 **Modal Windows** - Accessible, customizable modal system
- 📜 **Inertial Scrolling** - Smooth, physics-based scrolling animations
- 🎨 **Framework Agnostic** - Works with any JavaScript framework or vanilla JS

## Features

### Custom Media Queries (v0.2.1+)

VaultCSS provides flexible custom media query support with multiple override methods:

```css
/* Use built-in breakpoints */
@media (--sm) { ... } /* width >= 36rem */  
@media (--md) { ... } /* width >= 48rem */
@media (--lg) { ... } /* width >= 64rem */
@media (--xl) { ... } /* width >= 80rem */
```

#### Built-in Breakpoints
```css
--xxs: (width >= 23.4375rem)  /* 375px */
--xs:  (width >= 25rem)       /* 400px */
--sm:  (width >= 36rem)       /* 576px */  
--md:  (width >= 48rem)       /* 768px */
--lg:  (width >= 64rem)       /* 1024px */
--xl:  (width >= 80rem)       /* 1280px */
--xxl: (width >= 96rem)       /* 1536px */
```

#### Configuration Options

```javascript
// vite.config.js / astro.config.mjs
import vaultcss from 'vite-plugin-vaultcss';

export default defineConfig({
  vite: {
    plugins: [
      vaultcss({
        // Enable built-in custom media queries (default: true)
        valutMediaQuery: true,
        
        // Override or add custom media programmatically
        customMedia: {
          "--mobile": "(max-width: 768px)",
          "--desktop": "(min-width: 1024px)",
          "--md": "(min-width: 900px)"  // Override built-in --md
        }
      })
    ]
  }
});
```

#### Priority Order (Highest to Lowest)

1. **In-file definitions** - `@custom-media --md (min-width: 900px);` in CSS/Astro files
2. **Plugin options** - `customMedia` in Vite plugin configuration  
3. **Built-in breakpoints** - Default VaultCSS breakpoints

### Perfect Compatibility

- ✅ **Astro** - Works in individual `.astro` file `<style>` blocks
- ✅ **TailwindCSS** - No @import conflicts, perfect coexistence
- ✅ **Any Vite project** - Framework agnostic

### LightningCSS Integration

- Ultra-fast CSS processing with Rust-based LightningCSS
- Container Query support
- CSS Nesting
- Modern CSS features

#### Usage Examples

```css
/* In any CSS or Astro file */
.component {
  /* Use built-in breakpoints */
  @media (--md) {
    padding: 2rem;
  }
  
  /* Override with custom definition */
  @custom-media --special (min-width: 600px) and (max-width: 1200px);
  @media (--special) {
    background: blue;
  }
}
```

```astro
<!-- In Astro files -->
<style>
@custom-media --tablet (min-width: 768px) and (max-width: 1024px);

.hero {
  @media (--lg) { font-size: 3rem; }
  @media (--tablet) { font-size: 2rem; }
}
</style>
```

## Migration from v0.1.x

### Removed Features (v0.2.1)

- `globalImportFilePaths` option - No longer needed with direct injection
- `prependGlobalImports()` method - Replaced with built-in custom media
- `customMediaPath` option - Simplified to programmatic configuration only

### Changed Behavior

- Custom media queries are now **enabled by default**
- No more @import statements - direct CSS injection for better performance
