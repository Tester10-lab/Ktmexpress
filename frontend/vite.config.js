import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rollupOptions: {
      output: {
        entryFileNames: (assetInfo) => {
          let name = assetInfo.name || 'chunk';
          name = name.replace(/vendor/i, 'portal');
          return `assets/[name]-[hash].js`;
        },
        chunkFileNames: (assetInfo) => {
          let name = assetInfo.name || 'chunk';
          name = name.replace(/vendor/i, 'portal');
          return `assets/[name]-[hash].js`;
        },
        manualChunks(id) {
          if (id.includes('VendorDashboard')) {
            return 'portal-dashboard';
          }
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'framework';
            }
            if (id.includes('lucide-react')) {
              return 'ui';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('socket.io-client')) {
              return 'socket';
            }
            return 'dependencies';
          }
        }
      }
    }
  }
})
