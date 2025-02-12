import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import the path module

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Example of using the path module
    },
  },
  plugins: [react()],
});
