import { defineConfig } from 'vitest/config';
import dts from 'vite-plugin-dts';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['cjs', 'es'],
            fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
        },
    },
    plugins: [dts({ outDir: 'dist' })],
    test: {
        include: ['test/**/*.test.ts'],
    },
});
