import tsconfigPaths from "vite-tsconfig-paths";
import { configDefaults, defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
    // Playwright specs run with `npm run e2e`, never under Vitest.
    exclude: [...configDefaults.exclude, "e2e/**"],
  },
});
