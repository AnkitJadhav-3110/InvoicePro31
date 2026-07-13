import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'json-summary'],
      reportsDirectory: './coverage',
      include: [
        'src/utils/pdfGenerator.ts',
        'src/rendering/**/*.ts',
        'src/rendering/**/*.tsx',
        'src/utils/customTemplatePDF.ts',
        'src/utils/imageExport.ts',
        'src/hooks/useAuthGuard.ts',
      ],
      thresholds: {
        lines: 50,
        functions: 50,
        statements: 50,
        branches: 40,
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
