<script setup lang="ts">
import { computed } from 'vue'
import { data as posts } from '../../../posts.data'
import BlogHeader from './BlogHeader.vue'

const tags = computed(() => {
  const map = new Map<string, number>()
  for (const post of posts) {
    for (const tag of post.tags) {
      map.set(tag, (map.get(tag) || 0) + 1)
    }
  }
  return Array.from(map.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
})
</script>

<template>
  <div class="tags-page">
    <BlogHeader />
    <main class="tags-content">
      <h1 class="tags-title">Tags</h1>
      <p class="tags-subtitle">{{ tags.length }} topics</p>
      <div class="tags-cloud">
        <a
          v-for="tag in tags"
          :key="tag.name"
          :href="`/tags/${tag.name}`"
          class="tag-card"
        >
          <span class="tag-name">{{ tag.name }}</span>
          <span class="tag-count">{{ tag.count }}</span>
        </a>
      </div>
    </main>
  </div>
</template>

<style scoped>
.tags-page {
  min-height: 100vh;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-1);
}

.tags-content {
  max-width: var(--vp-layout-max-width, 1100px);
  margin: 0 auto;
  padding: 4rem 24px;
}

.tags-title {
  font-family: var(--vp-font-family-heading, Georgia, serif);
  font-size: 3rem;
  font-weight: 600;
  line-height: 1.15;
  margin: 0 0 0.5rem;
  color: var(--vp-c-text-1);
}

.tags-subtitle {
  font-size: 1rem;
  color: var(--vp-c-text-2);
  margin: 0 0 2.5rem;
}

.tags-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.tag-card {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5em 1em;
  border-radius: 100px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-brand-1);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  box-shadow: var(--vp-shadow-1);
}

.tag-card:hover {
  background: var(--vp-c-brand-1);
  color: #fff;
  transform: translateY(-2px);
}

.tag-count {
  font-size: 0.75rem;
  opacity: 0.7;
}
</style>
