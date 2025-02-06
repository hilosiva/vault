import browserslist from 'browserslist';
import {transform,  composeVisitors, browserslistToTargets } from "lightningcss";
import type { Targets } from "lightningcss";
import fluidVisitor from "lightningcss-plugin-fluid";
import type { Config as fluidConfig} from "lightningcss-plugin-fluid";
import prettier from "prettier";


export interface PluginOptions {
  globalImportFilePaths?: string | string[];
  targets?: string | string[];
  fluid?: fluidConfig;
  minify?: boolean;
  valutMediaQuery?: boolean;
}

export class VaultCss {
  private targets: Targets;
  private minify: boolean = false;
  private fluidOptions?: fluidConfig;
  private globalImports: Set<string> =  new Set();


  constructor(options?: Partial<PluginOptions>) {

    this.targets = browserslistToTargets(browserslist(options?.targets || "defaults"));

    if (options?.minify) {
      this.minify = options.minify;
    }

    if (options?.valutMediaQuery) {
       this.globalImports.add("vaultcss/mediaqueries.css");
    }


    if (options?.globalImportFilePaths) {
      const paths = options.globalImportFilePaths;

      if (Array.isArray(paths)) {
        paths.forEach(path => this.globalImports.add(path));
      } else  {
        this.globalImports.add(paths);
      }
    }

    if (options?.fluid) {
      this.fluidOptions = options?.fluid;
    }

  }


   prependGlobalImports(css: string) {


    if (this.globalImports.size === 0) {
      return css;
    }


    const imports = [...this.globalImports].map(path => `@import "${path}";`).join("\n");

    // @charset や @layer の最後の位置を検索
    const regex = /@(?:charset|layer)\b[^;]*;/gi;
    let match;
    let lastIndex = 0;

    while ((match = regex.exec(css)) !== null) {
      lastIndex = match.index + match[0].length; // 最後のマッチの終了位置を取得
    }

    return css.slice(0, lastIndex) + (lastIndex > 0 ? "\n" : "") + imports + "\n" + css.slice(lastIndex);

  }



  optimize(input: string, { file = "input.css" }: { file?: string } = {}) {
    return transform({
      filename: file,
      code: Buffer.from(input),
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
      visitor: composeVisitors([fluidVisitor(this.fluidOptions)])
    }).code.toString();
  }

  async compiler(css: string) {
    return await prettier.format(this.optimize(css), { parser: "css" });
  }
}
