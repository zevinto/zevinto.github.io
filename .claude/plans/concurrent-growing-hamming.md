# 详情页体验优化计划

## Context

用户反馈两个核心问题：
1. **过渡生硬** — 从首页点击文章进入详情页时，由于 `Layout()` 函数返回两套完全不同的组件树（首页用独立 `BlogHome`，详情用 `DefaultTheme.Layout`），Vue 执行硬卸载/挂载，没有任何过渡动画
2. **顶栏不一致** — BlogHome 使用自定义极简 header（logo + nav-links + theme-toggle），详情页使用 VitePress 默认的 `VPNavBar`（含搜索、社交链接、汉堡菜单、分割线），视觉风格割裂

## 方案设计

### 核心思路：提取共享 Header + 替换默认 Nav + 页面入场动效

不使用 `layout-top` 插槽注入（它会渲染在 VPNavBar 之上而非替代），而是：
1. **提取 `BlogHeader.vue`** — 将 BlogHome 中的 header 逻辑抽出为可复用组件
2. **CSS 隐藏默认 VPNavBar** — `display: none` + `--vp-nav-height: 0px`
3. **在详情页渲染 BlogHeader** — 通过 `layout-top` 插槽注入，使其位于页面顶部自然流
4. **VPContent padding-top 归零** — 因 nav 已隐藏，内容区无需额外上内边距
5. **添加 fadeIn 入场动画** — 解决过渡生硬问题

### 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `docs/.vitepress/theme/components/BlogHeader.vue` | **新建** | 从 BlogHome.vue 提取的共享 header |
| `docs/.vitepress/theme/components/BlogHome.vue` | **修改** | 替换内联 header 为 `<BlogHeader/>` |
| `docs/.vitepress/theme/index.ts` | **修改** | 详情页注入 layout-top + doc-before 插槽 |
| `docs/.vitepress/theme/custom.css` | **修改** | 添加 VPNavBar 隐藏、入场动画、调整内容区间距 |

### 详细步骤

#### Step 1: 新建 `BlogHeader.vue`

将 BlogHome.vue 中以下内容抽出为新组件：

- `<script setup>`：`useData().isDark` + `toggleAppearance()` + `useRoute()` 用于 active 导航高亮
- `<template>`：`header.blog-header` → `a.logo` + `.header-right`(nav-links + theme-toggle)
- `<style scoped>`：blog-header / logo / header-right / nav-links / nav-link / theme-toggle 所有相关样式

关键改进：
- **导航 active 状态动态化**：`/` 路径对应 Writing，`/posts/*` 路径时 Writing 也高亮
- 清除 `toggleAppearance` 的重复定义（原在 BlogHeader 和 Layout 两处）

#### Step 2: 修改 `BlogHome.vue`

- 移除内联 header 的 HTML 模板和 CSS 样式
- 使用 `<BlogHeader/>` 组件代替
- 保留其余所有内容（intro、posts、sidebar、filtering）

#### Step 3: 修改 `index.ts`

为详情页渲染注入两个插槽：

```ts
// Article pages
return h(DefaultTheme.Layout, null, {
  'layout-top': () => h(BlogHeader),
  'doc-before': () => h(PostMeta),
})
```

`layout-top` 渲染在 Layout 最顶部（VPNavBar 上方），随后 VPNavBar 被 CSS 隐藏，BlogHeader 成为实际顶栏。

#### Step 4: 修改 `custom.css`

CSS 变更要点：

```css
/* 4a. 隐藏默认导航栏 */
.VPNav {
  display: none !important;
}

/* 4b. 关闭 nav 预留高度，内容区不再偏移 */
:root {
  --vp-nav-height: 0px !important;
}

/* 4c. BlogHeader 在 layout-top 中的定位 */
.layout-top .blog-header {
  /* 继承原来 BlogHome 中 header 的样式 */
}

/* 4d. 详情页入场动画 */
@keyframes doc-fade-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.VPDoc .content {
  animation: doc-fade-in 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
```

#### Step 5: 调整内容区间距

- 隐藏 VPNavBar 后，内容区顶部间距由 `--vp-nav-height` 变为 0。BlogHeader 在 normal flow 中自然占据高度，与首页一致
- 可能需要微调 `.VPDoc` 或 `.content` 的 `padding-top` 确保对齐

### 技术支持

- `useRoute()` 和 `useData()` 均可从 `vitepress` 包直接导入
- VitePress 的 DefaultTheme.Layout 的插槽列表（已通过探索确认）：
  - `layout-top` / `layout-bottom` — Layout 级插槽
  - `nav-bar-content-before/after` — Nav 内插槽
  - `doc-before` / `doc-after` — 文档页插槽
- `--vp-nav-height` CSS 变量控制 VPContent 的 padding-top 偏移

### 验证方法

1. 运行 `npm run docs:build` 确保编译通过
2. 运行 `npm run docs:preview` 在浏览器中验证：
   - 首页 header 与之前一致
   - 详情页顶栏与首页顶栏视觉一致
   - 点击文章进入详情时内容区域有淡入动画
   - 在移动端响应正常
