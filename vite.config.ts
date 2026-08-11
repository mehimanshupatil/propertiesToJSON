import { defineConfig } from 'vitest/config';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['cjs', 'es'],
            fileName: (format) => (format === 'es' ? 'index.mjs' : 'index.cjs'),
        },
    },
    test: {
        include: ['test/**/*.test.ts'],
    },
});
