# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.2] - 2025-01-08

### Improved
- 🧹 **Code Optimization** - Removed unused imports and redundant code in vite plugin
- ⚡️ **Performance** - Replaced path module with native string operations for better efficiency
- 📦 **Bundle Size** - Further reduced package size by cleaning up unnecessary dependencies

### Removed
- 🗑️ **Unused Dependencies** - Removed redundant path imports and fallback vault instance creation

## [0.2.1] - 2025-01-08

### Fixed
- 🐛 **Custom Media Query Resolution** - Fixed critical issue where custom media queries were not being processed correctly in Astro projects
- 🔧 **TypeScript Import Errors** - Resolved `PluginOptions` import issues in vite-plugin-vaultcss

### Improved  
- 🧹 **Simplified Implementation** - Replaced complex file-based loading with reliable JavaScript-based custom media definitions
- ⚡️ **Performance** - Removed unnecessary file I/O operations and dependency resolution
- 📦 **Bundle Size** - Reduced package size by removing unused functions and dependencies

### Removed
- 🗑️ **Deprecated Features** - Removed `customMediaPath` option (complex file loading system)
- 🗑️ **Unused Code** - Cleaned up `parseCustomMediaFromCSS` and `loadCustomMediaFromFile` functions
- 🗑️ **Redundant CSS** - Removed duplicate `@import "./mediaqueries.css"` from index.css
- 🗑️ **Unused Dependencies** - Removed redundant path imports and fallback vault instance creation

### Technical Details
- Custom media queries are now defined directly in JavaScript for guaranteed availability
- Priority order clarified: In-file definitions > Plugin options > Built-in breakpoints  
- Simplified API surface with focus on programmatic configuration

## [0.2.0] - 2024-12-19

### Added
- 🎉 **Enhanced Custom Media Query System**
  - `customMediaPath` option to load custom media from CSS files
  - `customMedia` option for programmatic custom media definition
  - Automatic CSS parsing of `@custom-media` declarations
  - Support for project-specific custom media queries
  - Priority-based override system (built-in → file → programmatic)

- 🔧 **Developer Experience Improvements**
  - Custom media queries enabled by default (`valutMediaQuery: true`)
  - ESM/CJS dual environment support with proper fallbacks
  - Better error handling with hardcoded defaults

### Changed
- 🚀 **Performance & Architecture**
  - **BREAKING**: Removed `@import` method in favor of direct CSS injection
  - Direct LightningCSS integration for custom media handling
  - Each CSS file gets custom media definitions injected individually
  - Perfect Astro compatibility - works in individual `.astro` file `<style>` blocks
  - TailwindCSS compatibility - no more @import conflicts

- 📦 **Dependencies**
  - Updated `lightningcss` to `1.30.1`
  - Updated `lightningcss-plugin-fluid` to `0.0.7`

### Removed
- ❌ **BREAKING**: `globalImportFilePaths` option (no longer needed)
- ❌ **BREAKING**: `prependGlobalImports()` method (replaced with direct injection)
- ❌ All `@import` based CSS injection logic

### Fixed
- 🐛 Fixed TypeScript build errors in vite-plugin-vaultcss
- 🐛 Resolved custom media query processing order issues
- 🐛 Fixed compatibility issues with TailwindCSS and other CSS frameworks

### Migration Guide

#### From v0.1.x to v0.2.0

**Removed APIs:**
```javascript
// ❌ No longer available
vaultcss({
  globalImportFilePaths: ["./styles/globals.css"] // Removed
})

// ❌ Method removed
vault.prependGlobalImports(css) // Removed
```

**New Improved APIs:**
```javascript
// ✅ New flexible options
vaultcss({
  valutMediaQuery: true, // Default: true (was opt-in before)
  customMediaPath: "./src/styles/breakpoints.css", // NEW
  customMedia: { // NEW
    "--mobile": "(width <= 768px)",
    "--tablet": "(width >= 769px) and (width <= 1024px)"
  }
})
```

**What's Better:**
- ✅ No more manual `@import "vaultcss/mediaqueries.css"` needed
- ✅ Works perfectly in Astro individual file `<style>` blocks  
- ✅ No conflicts with TailwindCSS or other CSS frameworks
- ✅ Faster processing with direct injection
- ✅ More flexible custom media query system

## [0.1.11] - 2024-12-19

### Changed
- Updated dependencies for compatibility

## [0.1.10] - 2024-12-18

### Added
- Initial release of vite-plugin-vaultcss
- Basic custom media query support with @import method

---

**Legend:**
- 🎉 New Features
- 🚀 Performance/Architecture 
- 🔧 Developer Experience
- 📦 Dependencies
- 🐛 Bug Fixes
- ❌ Breaking Changes
- ✅ Improvements