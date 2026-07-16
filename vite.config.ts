import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router-dom')) return 'vendor-react';
          if (id.includes('node_modules/three') || id.includes('node_modules/@react-three/fiber') || id.includes('node_modules/@react-three/drei')) return 'vendor-three';
          if (id.includes('node_modules/pdfjs-dist') || id.includes('node_modules/pdf-lib')) return 'vendor-pdf';
          if (id.includes('node_modules/@supabase/supabase-js')) return 'vendor-supabase';
          if (id.includes('node_modules/framer-motion') || id.includes('node_modules/motion')) return 'vendor-motion';
          if (id.includes('node_modules/lucide-react') || id.includes('node_modules/zustand') || id.includes('node_modules/react-dropzone')) return 'vendor-ui';
        },
      },
    },
  },
})
