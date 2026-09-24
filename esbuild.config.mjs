import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";

const banner = `/* Accent Letters for Obsidian — https://accentletters.wiki/ */`;
const prod = process.argv[2] === "production";

const ctx = await esbuild.context({
  banner: { js: banner },
  entryPoints: ["src/main.ts"],
  bundle: true,
  // Obsidian and CodeMirror are provided by the app; bundling them would both bloat main.js and
  // load a second copy of the editor.
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*", ...builtins],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  minify: prod,
});

if (prod) { await ctx.rebuild(); process.exit(0); } else { await ctx.watch(); }
