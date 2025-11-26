import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Set the base path to '/Experium/' for GitHub Pages
  base: process.env.GITHUB_PAGES ? '/Experium/' : '/',
base: '/Experium/' 
  

  
  },
}));
