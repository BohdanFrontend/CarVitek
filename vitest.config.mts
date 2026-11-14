import path from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

/**
 * Windows: якщо термінал відкрито як «d:\…», Vitest стартує зі шляху з малою літерою
 * диска, а тестові файли резолвить як «D:/…» — і завантажує себе двічі (тести падають
 * з «Cannot read properties of undefined (reading 'config')»). Тому в тестах імпорт
 * "vitest" прив'язуємо до того самого шляху, з якого запущено головний процес.
 */
const vitestEntry = path.join(process.cwd(), "node_modules", "vitest", "dist", "index.js")

export default defineConfig({
  resolve: {
    alias: [
      { find: "@", replacement: fileURLToPath(new URL("./src", import.meta.url)) },
      { find: /^vitest$/, replacement: vitestEntry },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
})
