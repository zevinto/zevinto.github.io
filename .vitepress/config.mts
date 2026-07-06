import { defineConfig } from 'vitepress'

// ============================================================
//  VitePress Site Configuration
//  Blog: 极简杂志风个人博客
// ============================================================

export default defineConfig({
  // ---- Site Metadata ----
  title: "zevinto",
  titleTemplate: false,
  description: '记录思考，分享创造 — A personal blog about code & life',

  // ---- Clean URLs ----
  cleanUrls: true,

  // ---- Scroll Offset ----
  scrollOffset: '.blog-header-sticky',

  // ---- Sitemap ----
  sitemap: {
    hostname: 'https://zevinto.com',
  },

  // ---- Appearance ----
  appearance: true,

  // ---- Code Highlighting ----
  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },

  // ---- Head ----
  head: [
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com',
        crossorigin: '',
      },
    ],
    [
      'link',
      {
        href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap',
        rel: 'stylesheet',
      },
    ],
    ['meta', { name: 'theme-color', content: '#1e3a5f' }],
    ['meta', { name: 'og:type', content: 'website' }],
  ],

  // ---- Default Theme Config ----
  themeConfig: {
    // Clean nav (used on article pages)
    nav: [
      { text: 'Writing', link: '/' },
      { text: 'Projects', link: '/projects' },
      { text: 'About', link: '/about' },
    ],

    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/zevinto' },
    ],

    // Search
    search: {
      provider: 'local',
    },

    // Outline (table of contents)
    outline: {
      level: [2, 3],
      label: 'Contents',
    },

    // Footer
    footer: {
      copyright: '© 2026 Zevinto. All rights reserved.',
    },
  },
})
