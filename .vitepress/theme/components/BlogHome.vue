<script setup lang="ts">
/**
 * BlogHome.vue — 自定义博客首页
 *
 * 功能：
 * - 极简 Header (Logo + 导航)
 * - 大字衬线 Intro
 * - 双栏布局：文章列表 (主) + 标签墙/当前在读 (侧)
 * - 使用 VitePress Data Loading 构建时预取文章 frontmatter
 */
import { computed, ref, watch } from 'vue'
import { data as posts, type Post } from '../../../posts.data'
import { reading } from '../reading'
import BlogHeader from './BlogHeader.vue'

/* ---------- 日期格式化 ---------- */
function formatDate(date: string | Date): string {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/* ---------- 标签过滤 ---------- */
const activeTag = ref<string | null>(null)

const filteredPosts = computed(() => {
  if (!activeTag.value) return posts
  return posts.filter(post => post.tags.includes(activeTag.value!))
})

function setTag(tag: string) {
  activeTag.value = activeTag.value === tag ? null : tag
}

function clearTag() {
  activeTag.value = null
}

/* ---------- 分页 ---------- */
const pageSize = 5
const currentPage = ref(1)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(filteredPosts.value.length / pageSize))
)

const pagedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredPosts.value.slice(start, start + pageSize)
})

watch(activeTag, () => { currentPage.value = 1 })

function prevPage() {
  if (currentPage.value > 1) currentPage.value--
}

function nextPage() {
  if (currentPage.value < totalPages.value) currentPage.value++
}

/* ---------- 标签聚合 ---------- */
const allTags = computed<string[]>(() => {
  const tagSet = new Set<string>()
  for (const post of posts) {
    for (const tag of post.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
})
</script>

<template>
  <div class="blog-home">
    <BlogHeader />

    <!-- ====== Intro ====== -->
    <section class="intro-section">
      <h1 class="intro-title">
        记录思考，<br />
        分享创造
      </h1>
      <p class="intro-subtitle">
        A space for ideas, code, and stories. Written by
        <strong>zevinto</strong>.
      </p>
    </section>

    <!-- ====== Content Area ====== -->
    <div class="content-area">
      <!-- ---- Main: Post List ---- -->
      <main class="posts-section">
        <div class="section-head">
          <h2 class="section-label">
            {{ activeTag ? `#${activeTag}` : 'Latest Writing' }}
          </h2>
          <button v-if="activeTag" class="clear-filter" @click="clearTag">
            Clear filter
          </button>
        </div>

        <article v-for="post in pagedPosts" :key="post.url" class="post-item">
          <a :href="post.url" class="post-link">
            <h3 class="post-title">{{ post.title }}</h3>
            <div class="post-meta-line">
              <time :datetime="post.date">{{ formatDate(post.date) }}</time>
              <span
                v-for="tag in post.tags"
                :key="tag"
                class="post-tag"
                :class="{ 'is-active': activeTag === tag }"
                @click.prevent.stop="setTag(tag)"
              >{{ tag }}</span>
            </div>
            <p v-if="post.description" class="post-desc">
              {{ post.description }}
            </p>
          </a>
        </article>

        <!-- Empty state -->
        <p v-if="!filteredPosts.length && !activeTag" class="empty-state">
          No posts yet. Check back soon.
        </p>
        <p v-else-if="!filteredPosts.length && activeTag" class="empty-state">
          No posts tagged <strong>#{{ activeTag }}</strong>.
          <button class="clear-filter inline" @click="clearTag">View all</button>
        </p>

        <!-- Pagination -->
        <nav v-if="totalPages > 1" class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="prevPage"
          >← Newer</button>
          <span class="page-info">Page {{ currentPage }} of {{ totalPages }}</span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >Older →</button>
        </nav>
      </main>

      <!-- ---- Sidebar ---- -->
      <aside class="sidebar">
        <!-- Tags Widget -->
        <div class="widget">
          <h3 class="widget-title">Tags</h3>
          <div class="tag-cloud">
            <span
              v-for="tag in allTags"
              :key="tag"
              class="tag-item"
              :class="{ 'is-active': activeTag === tag }"
              @click="setTag(tag)"
            >{{ tag }}</span>
          </div>
          <p v-if="!allTags.length" class="widget-empty">No tags yet.</p>
        </div>

        <!-- Currently Reading Widget -->
        <div class="widget">
          <h3 class="widget-title">Currently Reading</h3>
          <div class="reading-card">
            <p class="reading-book">{{ reading.book }}</p>
            <p class="reading-author">{{ reading.author }}</p>
          </div>
        </div>
      </aside>
    </div>

    <!-- ====== Footer ====== -->
    <footer class="blog-footer">
      <p>&copy; {{ new Date().getFullYear() }} Zevinto. All rights reserved.</p>
    </footer>
  </div>
</template>

<style scoped>
/* ===================================
 *  Blog Home Layout
 * =================================== */

.blog-home {
  min-height: 100vh;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

/* ===================================
 *  Intro Section
 * =================================== */

.intro-section {
  max-width: var(--vp-layout-max-width, 1100px);
  margin: 0 auto;
  padding: 4rem 24px 3rem;
}

.intro-title {
  font-family: var(--vp-font-family-heading, Georgia, serif);
  font-size: 3.5rem;
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.02em;
  color: var(--vp-c-text-1);
  margin: 0 0 1rem;
}

.intro-subtitle {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
  max-width: 480px;
}

.intro-subtitle strong {
  color: var(--vp-c-text-1);
  font-weight: 500;
}

/* ===================================
 *  Content Area (posts + sidebar)
 * =================================== */

.content-area {
  display: grid;
  grid-template-columns: 1fr 280px;
  gap: 4rem;
  max-width: var(--vp-layout-max-width, 1100px);
  margin: 0 auto;
  padding: 0 24px 4rem;
}

/* ===================================
 *  Posts Section
 * =================================== */

.section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.section-label {
  font-family: var(--vp-font-family-base, sans-serif);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--vp-c-text-3);
  margin: 0;
}

.clear-filter {
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  letter-spacing: 0.02em;
  transition: opacity 0.2s ease;
}

.clear-filter:hover {
  opacity: 0.7;
}

.clear-filter.inline {
  color: var(--vp-c-brand-1);
  text-decoration: underline;
}

.post-item {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--vp-c-divider);
}

.post-item:last-of-type {
  border-bottom: none;
}

.post-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.post-title {
  font-family: var(--vp-font-family-heading, Georgia, serif);
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.35;
  color: var(--vp-c-text-1);
  margin: 0 0 0.375rem;
  display: inline-block;
  background: linear-gradient(to right, var(--vp-c-text-1), var(--vp-c-text-1));
  background-size: 0 1.5px;
  background-repeat: no-repeat;
  background-position: left bottom;
  transition: background-size 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.post-item:hover .post-title {
  background-size: 100% 1.5px;
}

.post-meta-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.post-meta-line time {
  font-feature-settings: 'tnum';
}

.post-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.15em 0.55em;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-tag:hover {
  background: var(--vp-c-brand-2);
  color: #fff;
}

.post-tag.is-active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.post-desc {
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--vp-c-text-2);
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 3rem 0;
  color: var(--vp-c-text-3);
  font-size: 0.9rem;
}

/* ---- Pagination ---- */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--vp-c-divider);
}

.page-btn {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: none;
  border: none;
  padding: 0.4rem 0.8rem;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.page-btn:hover:not(:disabled) {
  background: var(--vp-c-brand-soft);
}

.page-btn:disabled {
  color: var(--vp-c-text-3);
  cursor: default;
  opacity: 0.4;
}

.page-info {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  font-feature-settings: 'tnum';
}

/* ===================================
 *  Sidebar
 * =================================== */

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.widget {
  background: var(--vp-c-bg-soft);
  border-radius: var(--vp-radius-md, 10px);
  padding: 1.25rem;
  box-shadow: var(--vp-shadow-1);
}

.widget-title {
  font-family: var(--vp-font-family-base, sans-serif);
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--vp-c-text-3);
  margin: 0 0 0.75rem;
}

/* ---- Tag Cloud ---- */
.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
}

.tag-item {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.25em 0.7em;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-item:hover {
  background: var(--vp-c-brand-2);
  color: #fff;
}

.tag-item.is-active {
  background: var(--vp-c-brand-1);
  color: #fff;
}

.widget-empty {
  font-size: 0.8rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

/* ---- Currently Reading ---- */
.reading-card {
  padding: 0.25rem 0;
}

.reading-book {
  font-family: var(--vp-font-family-heading, Georgia, serif);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0 0 0.25rem;
}

.reading-author {
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin: 0;
}

/* ===================================
 *  Footer
 * =================================== */

.blog-footer {
  text-align: center;
  padding: 2rem 24px 3rem;
  border-top: 1px solid var(--vp-c-divider);
  max-width: var(--vp-layout-max-width, 1100px);
  margin: 0 auto;
}

.blog-footer p {
  font-size: 0.75rem;
  color: var(--vp-c-text-3);
  margin: 0;
}

/* ===================================
 *  Responsive
 * =================================== */

@media (max-width: 860px) {
  .content-area {
    grid-template-columns: 1fr;
    gap: 2rem;
  }

  .intro-title {
    font-size: 2.5rem;
  }


}

@media (max-width: 480px) {
  .intro-title {
    font-size: 2rem;
  }

  .intro-section {
    padding: 2rem 24px 2rem;
  }

  .content-area {
    padding: 0 16px 3rem;
  }
}
</style>
