import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // Logic and route tests run in Node; only component tests pay for jsdom.
    // Booting jsdom for every file starved the component tests of CPU when the
    // whole suite ran in parallel, and they randomly hit the 5 s timeout.
    projects: [
      {
        extends: true,
        test: { name: "unit", environment: "node", include: ["src/**/*.test.ts"] },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["src/**/*.test.tsx"],
          // Running alone, the slowest component test takes ~0.9 s; under a
          // full parallel run the same test can take 4.5 s on a 4-CPU machine.
          // With the default 5 s limit those runs failed at random, which made
          // the suite lie: the timeout measured machine load, not the code. A
          // real hang is still caught, just later.
          testTimeout: 20_000,
          hookTimeout: 20_000,
        },
      },
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/components/**/*.tsx"],
    },
  },
});
