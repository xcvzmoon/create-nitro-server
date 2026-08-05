import { defineConfig } from 'nitro';

export default defineConfig({
  compatibilityDate: '2026-08-04',
  serverDir: './server',
  serverAssets: [{ baseName: 'emails', dir: './server/assets/emails' }],
});
