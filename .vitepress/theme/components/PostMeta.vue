<script setup lang="ts">
/**
 * PostMeta.vue — 文章详情页元数据栏
 *
 * 显示于 VitePress Layout 的 doc-top 插槽中，
 * 自动读取当前页 frontmatter 中的 date / tags / readingTime。
 */
import { computed } from 'vue'
import { useData, useRoute } from 'vitepress'

const { frontmatter } = useData()
const route = useRoute()

/** 是否处于文章页面（/posts/ 路径下） */
const isPost = computed(() => route.path.startsWith('/posts/'))

/** 格式化日期 */
function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
</script>

<template>
  <div v-if="isPost && frontmatter.date" class="post-meta-bar">
    <!-- 发布日期 -->
    <time :datetime="frontmatter.date">
      {{ formatDate(frontmatter.date) }}
    </time>

    <!-- 标签 -->
    <span v-if="frontmatter.tags?.length" class="post-tags">
      <a
        v-for="tag in frontmatter.tags"
        :key="tag"
        :href="`/tags/${tag}`"
        class="tag"
      >{{ tag }}</a>
    </span>

    <!-- 阅读时间 -->
    <span v-if="frontmatter.readingTime" class="reading-time">
      {{ frontmatter.readingTime }} min read
    </span>
  </div>
</template>


