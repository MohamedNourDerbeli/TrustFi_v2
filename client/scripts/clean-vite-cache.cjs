#!/usr/bin/env node
/* Clean Vite caches to avoid Windows EPERM rename issues */
const fs = require('fs');
const path = require('path');

const roots = [
  path.resolve(__dirname, '..', '.vite'),
  path.resolve(__dirname, '..', 'node_modules', '.vite'),
];

for (const p of roots) {
  try {
    if (fs.existsSync(p)) {
      fs.rmSync(p, { recursive: true, force: true });
      console.log(`[clean-vite-cache] Removed: ${p}`);
    }
  } catch (e) {
    console.warn(`[clean-vite-cache] Failed to remove ${p}:`, e.message);
  }
}
