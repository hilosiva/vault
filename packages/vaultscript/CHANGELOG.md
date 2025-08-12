# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.8] - 2025-01-08

### Fixed
- 🐛 **InvokerPolyfill Event Handling** - Prevent modal opening when `preventDefault` is already called
- 🔧 **Event Compatibility** - Improved compatibility with other event handlers by respecting existing event cancellation

### Improved
- ⚡️ **Event Processing** - Added `defaultPrevented` check in click handlers to ensure proper event flow
- 🛡️ **Defensive Programming** - Enhanced event handling robustness in InvokerPolyfill

### Technical Details
- Click handlers now check `event.defaultPrevented` before executing commands
- Ensures modal commands respect existing event cancellation from other handlers
- Applies to both main command handler and `applyToElement` method

## [0.1.7] - 2024-12-19

### Added
- Initial InvokerPolyfill implementation for command attributes
- Dialog and Popover support with custom media queries
- MutationObserver for dynamic content changes

---

**Legend:**
- 🎉 New Features
- 🚀 Performance/Architecture 
- 🔧 Developer Experience
- 📦 Dependencies
- 🐛 Bug Fixes
- ❌ Breaking Changes
- ✅ Improvements