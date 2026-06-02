// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, nitro (build-only using cloudflare as a default target),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const startClientCore = path.resolve(
  __dirname,
  "node_modules",
  "@tanstack",
  "start-client-core"
);
const startServerCore = path.resolve(
  __dirname,
  "node_modules",
  "@tanstack",
  "start-server-core"
);

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    resolve: {
      alias: [
        {
          find: "#tanstack-start-entry",
          replacement: path.resolve(startClientCore, "dist/esm/fake-entries/start.js"),
        },
        {
          find: "#tanstack-router-entry",
          replacement: path.resolve(startClientCore, "dist/esm/fake-entries/router.js"),
        },
        {
          find: "#tanstack-start-plugin-adapters",
          replacement: path.resolve(startClientCore, "dist/esm/fake-entries/plugin-adapters.js"),
        },
        {
          find: "#tanstack-start-server-fn-resolver",
          replacement: path.resolve(startServerCore, "dist/esm/fake-start-server-fn-resolver.js"),
        },
      ],
    },
    ssr: {
      noExternal: [
        "@tanstack/react-start",
        "@tanstack/start-client-core",
        "@tanstack/start-server-core",
        "@tanstack/start-plugin-core",
        "@tanstack/react-start-client",
        "@tanstack/react-start-server",
        "@tanstack/react-start-rsc",
      ],
    },
    server: {
      host: "0.0.0.0",
      hmr: {
        host: "localhost",
      },
    },
    preview: {
      allowedHosts: true,
    },
  },
});
