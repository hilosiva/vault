import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['esm'],
    dts: false,
    minify: false,
    sourcemap: false,
    clean: true,
    publicDir: "./styles"
  },
  {
    entry: ['src/index.ts'],
    format: ['cjs'],
    dts: true,
    minify: true,
    sourcemap: true,
    clean: false,
    cjsInterop: true,
  },
]);
