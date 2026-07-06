// ============================================================
//  Blog Theme Entry
//  Extends VitePress DefaultTheme with:
//    - Custom BlogHome for the homepage
//    - PostMeta injected into doc-top slot for article pages
//    - Global custom CSS
// ============================================================

import { h, computed, Transition } from 'vue'
import { useRoute } from 'vitepress'
import type { Theme } from 'vitepress'
import DefaultTheme from 'vitepress/theme'
import './custom.css'

import BlogHome from './components/BlogHome.vue'
import BlogHeader from './components/BlogHeader.vue'
import PostMeta from './components/PostMeta.vue'
import TagsIndex from './components/TagsIndex.vue'
import TagsPosts from './components/TagsPosts.vue'

export default {
  extends: DefaultTheme,

  Layout() {
    const route = useRoute()
    const isHome = computed(() => route.path === '/')
    const isTagIndex = computed(() => route.path === '/tags')
    const isTagPage = computed(() => route.path.startsWith('/tags/') && route.path !== '/tags')

    return h(
      Transition,
      { name: 'page', mode: 'out-in' },
      {
      default: () => {
        if (isHome.value) return h(BlogHome, { key: route.path })
        if (isTagIndex.value) return h(TagsIndex, { key: route.path })
        if (isTagPage.value) return h(TagsPosts, { key: route.path })
        return h(DefaultTheme.Layout, { key: route.path }, {
              'layout-top': () => h(BlogHeader),
              'doc-before': () => h(PostMeta),
            })
      },
      },
    )
  },

  enhanceApp({ app, router, siteData }) {
    // 可在此注册全局组件或插件
  },
} satisfies Theme
