import js from '@eslint/js';

export default [
 js.configs.recommended,
 {
 languageOptions: {
 globals: {
 process: 'readonly',
 console: 'readonly',
 Buffer: 'readonly',
 __dirname: 'readonly',
 __filename: 'readonly',
 setTimeout: 'readonly',
 clearTimeout: 'readonly',
 setInterval: 'readonly',
 clearInterval: 'readonly',
 setImmediate: 'readonly',
 global: 'readonly',
 },
 },
 rules: {
 'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
 'no-console': 'off',
 },
 },
 {
 ignores: [
 '**/node_modules/**',
 '**/dist/**',
 '**/.next/**',
 '**/out/**',
 '**/coverage/**',
 ],
 },
];
