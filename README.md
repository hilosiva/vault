# Vault

俺のフレキシブル CSS フレームワーク (Ore no Flexible CSS Framework)

A modern, flexible CSS framework built with LightningCSS for ultra-fast processing and cutting-edge CSS features.

## Packages

### 🎨 [vaultcss](./packages/vaultcss) 
**Core CSS Framework**
- ⚡️ **LightningCSS Processing** - Rust-powered, 100x faster than JS alternatives
- 📱 **Custom Media Queries** - Flexible breakpoint system with override support
- 🌊 **Fluid Typography** - `fluid()` function for responsive scaling
- 🎯 **Modern CSS Support** - Container Queries, CSS Nesting, Custom Properties
- 🔧 **Configurable** - Customize breakpoints, load from files, or define programmatically

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

### Custom Media Queries (v0.2.0+)

VaultCSS provides flexible custom media query support:

```css
/* Use built-in breakpoints */
@media (--lg) { ... } /* width >= 64rem */
@media (--xl) { ... } /* width >= 80rem */
```

#### Configuration Options

```javascript
// vite.config.js
export default defineConfig({
  plugins: [
    vaultcss({
      // Built-in custom media queries (default: true)
      valutMediaQuery: true,
      
      // Load custom media from file
      customMediaPath: "./src/styles/breakpoints.css",
      
      // Define custom media programmatically
      customMedia: {
        "--mobile": "(width <= 768px)",
        "--desktop": "(width >= 1024px)"
      }
    })
  ]
});
```

#### Priority Order

1. **Built-in** - Default breakpoints (--xs, --sm, --md, --lg, --xl, --xxl)
2. **File** - Loaded from `customMediaPath`
3. **Programmatic** - Defined in `customMedia` (highest priority)

### Perfect Compatibility

- ✅ **Astro** - Works in individual `.astro` file `<style>` blocks
- ✅ **TailwindCSS** - No @import conflicts, perfect coexistence
- ✅ **Any Vite project** - Framework agnostic

### LightningCSS Integration

- Ultra-fast CSS processing with Rust-based LightningCSS
- Container Query support
- CSS Nesting
- Modern CSS features

## Migration from v0.1.x

### Removed Features

- `globalImportFilePaths` option - No longer needed
- `prependGlobalImports()` method - Replaced with direct injection

### Changed Behavior

- Custom media queries are now **enabled by default**
- No more @import statements - direct CSS injection for better performance
