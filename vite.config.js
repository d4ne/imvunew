import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
    base: '/',
    plugins: [react()],
    resolve: {
        alias: { '@': './src' },
    },
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
            '/i': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        },
    },
});
