import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

export default defineConfig({
  base: '/Experium/',
});
  plugins: [
    react(),
    mode === 'development' && componentTagger()
  ].filter(Boolean), // This filters out undefined, which happens if the mode is not 'development'
  resolve: {
    alias: {
      "@": path.resolve(__dirname, './src'),
    },
  },
}));
