import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Minimal engine-level test config (LP-2 §13) — this repo has no prior test framework, so this is
 * intentionally the smallest config that runs plain TypeScript fixture tests, not a general
 * component/integration test setup. Only `lib/print/**` has tests today.
 *
 * `server-only` is aliased to a no-op stub for tests only: the real package (node_modules/
 * server-only/index.js) unconditionally throws unless resolved under Next.js's `react-server`
 * bundler condition, which plain Vitest/Node doesn't set. Every `lib/print/*.ts` file imports
 * `"server-only"` at the top (matching this codebase's existing whole-file-guard convention, e.g.
 * lib/erpnext.ts) purely to prevent an accidental client-bundle import in the real app — it has no
 * bearing on the pure logic these tests exercise, so stubbing it out for the test run only (never
 * for `next build`) doesn't weaken that guard in production.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "server-only": path.resolve(__dirname, "./test/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts"],
  },
});
