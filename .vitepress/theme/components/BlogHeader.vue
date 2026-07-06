<script setup lang="ts">
/**
 * BlogHeader.vue — 共享顶栏组件
 *
 * 首页和文章详情页使用统一的顶栏（Logo + 导航 + 主题切换）。
 * 首页通过 <BlogHeader/> 直接渲染，详情页通过 layout-top 插槽注入。
 */
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

/* ---------- 亮暗模式 ---------- */
const { isDark } = useData()
const route = useRoute()

function toggleAppearance() {
  isDark.value = !isDark.value
}

/* ---------- Logo 点击: 已在首页则平滑回顶 ---------- */
function handleLogoClick(e: MouseEvent) {
  if (route.path === '/') {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

/* ---------- 导航高亮 ---------- */
const isWriting = computed(
  () => route.path === '/' || route.path.startsWith('/posts/') || route.path.startsWith('/tags'),
)
</script>

<template>
  <div class="blog-header-sticky">
    <header class="blog-header">
      <a href="/" class="logo" @click="handleLogoClick">
        <img src="/logo.png" alt="zevinto" />
      </a>
      <div class="header-right">
        <nav class="nav-links">
          <a href="/" class="nav-link" :class="{ active: isWriting }">Writing</a>
          <a href="/projects" class="nav-link">Projects</a>
          <a href="/about" class="nav-link">About</a>
        </nav>
        <button class="theme-toggle" :title="isDark ? '切换到亮色模式' : '切换到暗色模式'" @click="toggleAppearance"
          aria-label="切换亮暗模式">
          <!-- 太阳（暗色下显示） -->
          <svg class="theme-icon sun-icon" :class="{ hidden: !isDark }" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          <!-- 月亮（亮色下显示） -->
          <svg class="theme-icon moon-icon" :class="{ hidden: isDark }" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </button>
      </div>
    </header>
  </div>
</template>

<style scoped>
/* ===================================
 *  Blog Header — Fixed Top Bar
 * =================================== */

.blog-header-sticky {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--vp-c-bg);
  border-bottom: 1px solid var(--vp-c-divider);
}

.blog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: var(--vp-layout-max-width, 1200px);
  margin: 0 auto;
  padding: 1.25rem 24px;
}

.logo {
  display: flex;
  align-items: center;
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.logo:hover {
  opacity: 0.7;
}

.logo img {
  display: block;
  height: 36px;
  width: auto;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-links {
  display: flex;
  gap: 2rem;
}

.nav-link {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: var(--vp-c-text-2);
  text-decoration: none;
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover,
.nav-link.active {
  color: var(--vp-c-text-1);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  right: 0;
  height: 1.5px;
  background: var(--vp-c-text-1);
  border-radius: 1px;
}

/* ---- Theme Toggle ---- */
.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--vp-c-border);
  border-radius: 50%;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-2);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: var(--vp-shadow-1);
}

.theme-toggle:hover {
  color: var(--vp-c-text-1);
  border-color: var(--vp-c-text-3);
  box-shadow: var(--vp-shadow-2);
}

.theme-icon {
  width: 16px;
  height: 16px;
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.theme-icon.hidden {
  opacity: 0;
  transform: scale(0.5);
  position: absolute;
  pointer-events: none;
}

/* ===================================
 *  Responsive
 * =================================== */

@media (max-width: 860px) {
  .blog-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .nav-links {
    gap: 1.25rem;
  }
}
</style>
