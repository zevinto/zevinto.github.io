import { createContentLoader } from 'vitepress'

export interface Post {
  title: string
  url: string
  date: string
  tags: string[]
  description: string
  readingTime: number
}

declare const data: Post[]
export { data }

function calculateReadingTime(src: string): number {
  const body = src.replace(/---[\s\S]*?---\n*/, '')
  const text = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*`~\[\]()>|_\\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const cjk = (text.match(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g) || []).length
  const nonCjk = text.replace(/[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/g, ' ')
  const words = nonCjk.split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(cjk / 300 + words / 200))
}

export default createContentLoader('posts/*.md', {
  transform(raw): Post[] {
    return raw
      .filter(({ frontmatter }) => !frontmatter.draft)
      .sort((a, b) => +new Date(b.frontmatter.date) - +new Date(a.frontmatter.date))
      .map(({ url, frontmatter, src }) => ({
        title: frontmatter.title,
        url,
        date: frontmatter.date,
        tags: frontmatter.tags || [],
        description: frontmatter.description || '',
        readingTime: src ? calculateReadingTime(src) : (frontmatter.readingTime || 0),
      }))
  },
})
