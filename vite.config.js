// vite.config.js
import { defineConfig } from 'vite'

export default defineConfig({
    // Base URL for deployment (change this for your hosting)
    base: './',

    // Build configuration
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,

        // Optimize for modern browsers but maintain compatibility
        target: 'es2018',

        rollupOptions: {
            input: {
                main: './index.html'
            }
        }
    },

    // Development server configuration
    server: {
        port: 3000,
        open: true,
        host: true
    },

    // CSS configuration
    css: {
        devSourcemap: true
    },

    // Plugins (add more as needed)
    plugins: [],

    // Optimize dependencies
    optimizeDeps: {
        include: ['chart.js', 'jspdf']
    }
})