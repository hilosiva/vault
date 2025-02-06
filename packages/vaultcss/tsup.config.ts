import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    minify: true,
    sourcemap: true,
    clean: true,
    cjsInterop: true,
    publicDir: "./styles"
  },
  // {
  //   entry: ['./src/*.css'],
  //   minify: true,
  //   sourcemap: false,
  //   clean: true,
  //   target: "es2020",
  //   // outDir: "dist/styles",
  // },
  {
    entry: {
      reset: 'node_modules/@hilosiva/oreset/dist/oreset.css'
    },
    minify: true,
    sourcemap: false,
    clean: true,
    target: "es2020",
    // outDir: "dist/styles",
  },
]);
