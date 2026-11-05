// A subprocess-free build for restricted Windows environments. Vite remains the default.
import { rollup } from "rollup";
import { nodeResolve } from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import ts from "typescript";
import { readFile, mkdir, writeFile, cp } from "node:fs/promises";
const bundle = await rollup({
  input: "src/main.tsx",
  plugins: [
    {
      name: "typescript-and-css",
      transform(code, id) {
        if (id.endsWith(".css")) return { code: "", map: null };
        if (/\.tsx?$/.test(id) && !id.includes("node_modules"))
          return {
            code: ts.transpileModule(code, {
              compilerOptions: {
                target: ts.ScriptTarget.ES2022,
                module: ts.ModuleKind.ESNext,
                jsx: ts.JsxEmit.ReactJSX,
              },
            }).outputText,
            map: null,
          };
        return null;
      },
    },
    nodeResolve({
      browser: true,
      extensions: [".mjs", ".js", ".json", ".ts", ".tsx"],
      dedupe: ["react", "react-dom", "three"],
    }),
    {
      name: "production-env",
      transform(code) {
        return code.includes("process.env.")
          ? {
              code: code.replaceAll("process.env.NODE_ENV", '"production"').replaceAll("process.env.REACT_APP_BACKEND_URL", '""'),
              map: null,
            }
          : null;
      },
    },
    commonjs(),
  ],
  onwarn(warning, warn) {
    if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning);
  },
});
await mkdir("dist", { recursive: true });
await bundle.write({
  dir: "dist",
  format: "es",
  entryFileNames: "app.js",
  chunkFileNames: "[name]-[hash].js",
});
await bundle.close();
await writeFile("dist/styles.css", await readFile("src/styles.css"));
const html = (await readFile("index.html", "utf8"))
  .replace("/src/main.tsx", "/app.js")
  .replace("</head>", '<link rel="stylesheet" href="/styles.css"/></head>');
await writeFile("dist/index.html", html);
console.log("Portable production build written to dist/.");

await cp("public", "dist", { recursive: true });
