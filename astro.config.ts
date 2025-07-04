import mdx from '@astrojs/mdx'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import icon from 'astro-icon'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
  site: 'https://playground.shiftbrain.com/',
  base: '/post/hover-to-drop-text',
  server: {
    open: '/post/hover-to-drop-text',
  },
  prefetch: true,
  integrations: [
    mdx(),
    tailwind({
      nesting: true,
    }),
    icon(),
    react(),
  ],
  vite: {
    define: {
      'import.meta.vitest': 'undefined',
    },
  },
})
