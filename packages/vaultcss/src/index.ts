import browserslist from "browserslist";
import { transform, composeVisitors, browserslistToTargets } from "lightningcss";
import type { Targets } from "lightningcss";
import fluidVisitor from "lightningcss-plugin-fluid";
import type { Options as fluidOptions } from "lightningcss-plugin-fluid";
import prettier from "prettier";
import fs from "fs";
import path from "path";

/**
 * Parse custom media queries from CSS content
 */
function parseCustomMediaFromCSS(cssContent: string): Record<string, string> {
  const customMedia: Record<string, string> = {};
  const regex = /@custom-media\s+(--[a-zA-Z0-9-_]+)\s+([^;]+);/g;
  let match;
  
  while ((match = regex.exec(cssContent)) !== null) {
    const [, name, query] = match;
    customMedia[name] = query.trim();
  }
  
  return customMedia;
}

/**
 * Load custom media queries from file path
 */
function loadCustomMediaFromFile(filePath: string): Record<string, string> {
  try {
    if (fs.existsSync(filePath)) {
      const cssContent = fs.readFileSync(filePath, 'utf-8');
      return parseCustomMediaFromCSS(cssContent);
    }
  } catch (error) {
    console.warn(`Failed to load custom media from ${filePath}:`, error);
  }
  return {};
}

export interface PluginOptions {
  targets?: string | string[];
  fluid?: fluidOptions;
  minify?: boolean;
  valutMediaQuery?: boolean;
  customMediaPath?: string;
  customMedia?: Record<string, string>;
}

export class VaultCss {
  private targets: Targets;
  private minify: boolean = false;
  private fluidOptions?: fluidOptions;
  private customMedia: Record<string, string> = {};

  constructor(options?: Partial<PluginOptions>) {
    this.targets = browserslistToTargets(browserslist(options?.targets || "defaults"));

    if (options?.minify) {
      this.minify = options.minify;
    }

    // Load custom media queries (default: true)
    const enableBuiltinMedia = options?.valutMediaQuery ?? true;
    if (enableBuiltinMedia) {
      // Step 1: Use built-in custom media queries
      this.customMedia = {
        ...this.customMedia,
        "--xxs": "(width >= 23.4375rem)",
        "--xs": "(width >= 25rem)",
        "--sm": "(width >= 36rem)", 
        "--md": "(width >= 48rem)",
        "--lg": "(width >= 64rem)",
        "--xl": "(width >= 80rem)",
        "--xxl": "(width >= 96rem)",
      };
    }
    
    if (options?.customMediaPath) {
      // Step 2: Load from custom file path (can override built-in)
      this.customMedia = { ...this.customMedia, ...loadCustomMediaFromFile(options.customMediaPath) };
    }
    
    if (options?.customMedia) {
      // Step 3: Override with programmatically defined custom media (highest priority)
      this.customMedia = { ...this.customMedia, ...options.customMedia };
    }

    if (options?.fluid) {
      this.fluidOptions = options?.fluid;
    }
  }

  optimize(input: string, { file = "input.css" }: { file?: string } = {}) {
    // If custom media is defined, inject it at the beginning of the CSS
    let processedInput = input;
    if (Object.keys(this.customMedia).length > 0) {
      const customMediaDeclarations = Object.entries(this.customMedia)
        .map(([name, query]) => `@custom-media ${name} ${query};`)
        .join('\n');
      processedInput = customMediaDeclarations + '\n' + input;
    }

    return transform({
      filename: file,
      code: Buffer.from(processedInput),
      minify: this.minify,
      sourceMap: false,
      drafts: {
        customMedia: true,
      },
      nonStandard: {
        deepSelectorCombinator: true,
      },
      targets: this.targets,
      errorRecovery: true,
      visitor: composeVisitors([fluidVisitor(this.fluidOptions)]),
    }).code.toString();
  }

  async compiler(css: string) {
    return await prettier.format(this.optimize(css), { parser: "css" });
  }
}
