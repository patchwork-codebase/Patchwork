import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'


function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
  server: {
    proxy: {
      '/api/v1': {
        target: 'https://oaielnxqahmywdpisomd.supabase.co/functions/v1/make-server-30db7d9e',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/v1/, ''),
      },
      '/linear-api': {
        target: 'https://api.linear.app/graphql',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/linear-api/, ''),
      },
      '/clickup-api': {
        target: 'https://api.clickup.com/api/v2',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/clickup-api/, ''),
      },
      '/jira-api': {
        target: 'https://atlassian.net', // Placeholder, overridden by router
        changeOrigin: true,
        router: (req) => {
          const domain = req.headers['x-jira-domain'];
          return domain ? `https://${domain}` : 'https://atlassian.net';
        },
        rewrite: (path) => path.replace(/^\/jira-api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-syntax-highlighter')) {
              return 'syntax-highlighter';
            }
            if (id.includes('country-state-city')) {
              return 'geo-data';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // Let Vite automatically handle chunking for the rest to avoid circular chunk references
          }
        }
      }
    }
  }
})
