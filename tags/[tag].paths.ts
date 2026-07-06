import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default {
  paths() {
    const postsDir = path.resolve(__dirname, '../posts')
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'))
    const tags = new Set<string>()

    for (const file of files) {
      const content = fs.readFileSync(path.join(postsDir, file), 'utf-8')
      const fm = content.match(/---\n([\s\S]*?)\n---/)
      if (!fm) continue
      if (/draft:\s*true/.test(fm[1])) continue

      const tagMatch = fm[1].match(/(?:^|\n)tags:\s*\[([^\]]*)\]/)
      if (tagMatch) {
        tagMatch[1].split(',').forEach(t => {
          const tag = t.trim().replace(/['"]/g, '')
          if (tag) tags.add(tag)
        })
      }
    }

    return Array.from(tags).map(tag => ({ params: { tag } }))
  },
}
