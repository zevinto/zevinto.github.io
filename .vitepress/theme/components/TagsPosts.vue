<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vitepress'
import { data as posts } from '../../../posts.data'
import BlogHeader from './BlogHeader.vue'

const route = useRoute()

const tagName = computed(() => route.path.split('/tags/')[1] || '')

const tagPosts = computed(() =>
  posts.filter(post => post.tags.includes(tagName.value))
)

function formatDate(date: string | Date): string {
  const d = new Date(date)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
</script>

<template>
  <div class="tag-page">
    <BlogHeader />
    <main class="tag-content">
      <div class="tag-head">
        <a href="/tags" class="back-link">← All Tags</a>
        <h1 class="tag-title">#{{ tagName }}</h1>
        <p class="tag-posts-count">{{ tagPosts.length }} post{{ tagPosts.length !== 1 ? 's' : '' }}</p>
      </div>

      <article v-for="post in tagPosts" :key="post.url" class="post-item">
        <a :href="post.url" class="post-link">
          <h3 class="post-title">{{ post.title }}</h3>
          <div class="post-meta">
            <time :datetime="post.date">{{ formatDate(post.date) }}</time>
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="post-tag"
            >{{ tag }}</span>
          </div>
          <p v-if="post.description" class="post-desc">{{ post.description }}</p>
        </a>
      </article>

      <p v-if="!tagPosts.length" class="empty-state">
        No posts found for <strong>#{{ tagName }}</strong>.
      </p>
    </main>
  </div>
</template>

<style scoped>
.tag-page {
  min-height: 100vh;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.tag-content {
  max-width: var(--vp-layout-max-width, 1100px);
  margin: 0 auto;
  padding: 4rem 24px;
}

.tag-head {
  margin-bottom: 2.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--vp-c-divider);
}

.back-link {
  display: inline-block;
  font-size: 0.85rem;
  color: var(--vp-c-text-2);
  text-decoration: none;
  margin-bottom: 0.75rem;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--vp-c-brand-1);
}

.tag-title {
  font-family: var(--vp-font-family-heading, Georgia, serif);
  font-size: 2.5rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--vp-c-text-1);
}

.tag-posts-count {
  font-size: 0.9rem;
  color: var(--vp-c-text-2);
  margin: 0;
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
  margin: 0 0 0.5rem;
}

.post-title:hover {
  text-decoration: underline;
}

.post-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--vp-c-text-2);
  margin-bottom: 0.5rem;
}

.post-tag {
  display: inline-block;
  font-size: 0.7rem;
  font-weight: 500;
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
  padding: 0.15em 0.55em;
  border-radius: 100px;
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
</style>
