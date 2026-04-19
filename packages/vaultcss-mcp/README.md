# vaultcss-mcp

MCP server for the vaultcss ecosystem — brings setup guides, layer references, and project breakpoints into Claude Code, Cursor, and any MCP-compatible AI editor.

## Requirements

- **Node.js**: 20.19.0 以上（22.12.0 以上推奨）

## Overview

`vaultcss-mcp` runs as a stdio MCP server. On startup it reads the project's `package.json` and registers only the tools that match what is installed. If no vault packages are detected, all tools are registered as a fallback.

## Available Tools

| Tool | Registered when | Description |
|------|-----------------|-------------|
| `get_setup` | `vaultcss` or `vite-plugin-vaultcss` | Setup steps, file structure, and the `mediaqueries.css` marker rule |
| `get_layers` | `vaultcss` | Layer order (`tokens` → `reset` → `base` → `vendors` → `components` → `utilities`) and when to use each |
| `get_media_queries_guide` | `vaultcss` or `vite-plugin-vaultcss` | `@custom-media` syntax, default breakpoints, and customization |
| `get_vite_plugin` | `vite-plugin-vaultcss` | `vite.config.ts` options reference and auto-detection logic |
| `get_fluid_guide` | `vaultcss` or `vite-plugin-vaultcss` | `fluid()` syntax — compiles to `clamp()` for fluid responsive sizing |
| `get_vaultscript_libs` | `vaultscript` | Library and utility catalogue with usage examples |
| `get_breakpoints` | always | Reads the project's `mediaqueries.css` at call time and returns current breakpoints; returns empty if not found |

> `get_breakpoints` scans the filesystem on every call, so it always reflects the latest file contents rather than a startup snapshot.

## Setup

### Project-local — `.mcp.json`

Place `.mcp.json` in the project root. Claude Code and Cursor both pick this up automatically.

**Using `npx` (no installation needed)**

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

**After installing `vaultcss-mcp` as a dev dependency** (the `-y` flag is unnecessary)

```json
{
  "mcpServers": {
    "vaultcss": {
      "command": "npx",
      "args": ["vaultcss-mcp"]
    }
  }
}
```

### Claude Desktop — `claude_desktop_config.json`

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

The config file is located at:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

### Cursor — global MCP settings

Open **Settings → MCP → Add new MCP server** and paste:

```json
{
  "vaultcss": {
    "command": "npx",
    "args": ["-y", "vaultcss-mcp"]
  }
}
```

## Installation (optional)

Installing as a dev dependency avoids the `npx` download on each startup.

```bash
npm install -D vaultcss-mcp
# or
pnpm add -D vaultcss-mcp
```

Then remove `-y` from the `args` array in your `.mcp.json`.

## How It Works

1. On startup, the server reads `package.json` at `process.cwd()`.
2. It checks for `vaultcss`, `vite-plugin-vaultcss`, and `vaultscript` in both `dependencies` and `devDependencies`.
3. Only the tools that correspond to installed packages are registered.
4. If none of the vault packages are found, all tools are registered so you can still explore the docs.

The `get_breakpoints` tool is the exception: it does not run at startup. Instead, it scans the project tree each time it is called, so the breakpoints it returns are always in sync with your current `mediaqueries.css`.

## License

MIT
