import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'next/server': path.resolve('./apps/web/node_modules/next/server.js')
    }
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/unit/**/*.test.ts']
  }
});
