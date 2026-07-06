# AGENTS.md — zevinto blog

## 命令

```sh
npm run dev      # 开发服务器 localhost:5173
npm run build    # 生产构建
npm run preview  # 预览生产构建
```

## 架构

- **VitePress 博客**，完全自定义主题，继承 `DefaultTheme`。
- **首页** (`/`)：由 `BlogHome.vue` 渲染（非 VitePress 默认布局）。通过 `index.md` 中的 `layout: false` 配置。
- **文章页** (`/posts/*`)：使用 `DefaultTheme.Layout`，通过 `layout-top` 插槽注入 `BlogHeader`，通过 `doc-before` 插槽注入 `PostMeta`。

## 文章

- 在 `posts/` 下编写 markdown 文件。Frontmatter 必填：`title`、`date`、`tags`（数组）、`description`。
- `readingTime` 由 `posts.data.ts` 自动计算（分析中/英文混合内容），无需在 frontmatter 中填写。
- 草稿文章：frontmatter 添加 `draft: true`，将自动从文章列表中排除。
- `posts.data.ts` 在构建时聚合所有文章（过滤草稿，按日期降序排列）。

## 自定义主题 (`docs/.vitepress/theme/`)

- `index.ts` — 主题入口，为 `/` 路由替换为 `BlogHome`，为文章页注入 `BlogHeader` + `PostMeta` 插槽。
- `custom.css` — 完整的 CSS 变量设计系统。隐藏默认 `VPNav` / `VPLocalNav`（由 `BlogHeader` 替代）。页面过渡动画 (`.page-enter-active`)。Mac 风格代码块。
- 组件：
  - `BlogHeader.vue` — 固定顶栏，包含 logo、导航链接（Writing 在 `/` 和 `/posts/*` 路径下高亮）、主题切换。
- `BlogHome.vue` — 介绍区、双栏文章列表（分页，每页 5 篇）+ 侧边栏（标签组件 + 当前在读）。
- `PostMeta.vue` — 文章内容上方的日期/标签/阅读时间栏（标签可点击，跳转到 `/tags/[tag]`）。
- `TagsIndex.vue` — `/tags/` 页面，展示所有标签云（带文章数）。
- `TagsPosts.vue` — `/tags/[tag]` 页面，展示该标签下的文章列表。
- `reading.ts` — 编辑此文件以更新首页的"当前在读"组件。

## 导航

- 导航链接：Writing (`/`)、Projects (`/projects`)、About (`/about`)。
- "Writing" 链接在路径为 `/`、`/posts/*` 或 `/tags*` 时高亮。

## 配置

- `.vitepress/config.mts`：站点元数据、sitemap (zevinto.com)、clean URLs、本地搜索、Google Fonts 预连接、代码双主题高亮（github-light / github-dark）。
- `appearance: true` — 暗色模式支持，通过 `.dark` 类中的自定义 CSS 变量实现。

## 代码风格

- 所有样式使用 CSS 自定义属性（颜色、字体、间距、阴影）。
- 标题字体：衬线体 (Georgia/Garamond)。正文字体：Inter。代码字体：JetBrains Mono。
- 杂志风格设计：简洁、极简、宽松留白。
- Vue SFC 使用 `<script setup lang="ts">` 和 scoped 样式。
