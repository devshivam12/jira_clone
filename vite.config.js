import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // Import the path module

// Grouped by resolved path, not by bare package name. Naming 'react' in the
// object form of manualChunks matches only node_modules/react/index.js, so
// react/jsx-runtime - a separate module that almost every file in the app
// pulls in - was left unassigned and Rollup parked it in whichever forced
// chunk happened to reach it first. That was the TipTap chunk, so every page
// in the app ended up statically importing 410 kB of editor code just to get
// the JSX runtime. Matching on /node_modules/react/ covers the whole package.
//
// Only the three groups that genuinely load on first paint are forced here.
// Everything else is left to Rollup: now that the routes are lazy, it already
// splits the rest per route and emits shared chunks where two routes overlap,
// and it does that from the real import graph rather than a guess.
const VENDOR_GROUPS = [
  [/\/node_modules\/(react|react-dom|scheduler|use-sync-external-store)\//, 'vendor-react'],
  [/\/node_modules\/(react-router|react-router-dom|@remix-run)\//, 'vendor-router'],
  [/\/node_modules\/(@reduxjs|react-redux|redux|redux-persist|redux-thunk|reselect|immer)\//, 'vendor-redux'],
];

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'), // Example of using the path module
    },
  },
  plugins: [react()],
  // Strips console and debugger statements out of the production build only.
  // They still work in `npm run dev`. This matters beyond tidiness: anything
  // logged is held alive by the console as long as devtools is open, so
  // logging request/response objects kept whole slices of the store from
  // being garbage collected.
  esbuild: {
    drop: ['console', 'debugger'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          const normalized = id.split(path.sep).join('/');
          for (const [pattern, name] of VENDOR_GROUPS) {
            if (pattern.test(normalized)) return name;
          }
          return undefined;
        },
      },
    },
    // The default warning fires at 500 kB, which the old single bundle blew
    // past by a factor of four. Left at the default so it means something.
  },
});
