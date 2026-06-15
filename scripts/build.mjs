// Static-site builder for the FSP org homepage + daily reports.
//
// Reads every Markdown file under reports/, parses its frontmatter
// (date, author, title, tags), renders the body to HTML, and writes a
// static site into dist/:
//   - index.html        the org homepage + a reverse-chronological report list
//   - reports/<slug>.html  one page per report
//
// No framework, no client-side JS required. Run with: npm run build

import { readFileSync, readdirSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import { marked } from 'marked';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPORTS_DIR = join(ROOT, 'reports');
const ASSETS_DIR = join(ROOT, 'assets');
const DIST = join(ROOT, 'dist');

const ORG_NAME = 'FSP · Fish Social Platform';
const ORG_TAGLINE = '钓鱼社交平台 · 团队工作台';

marked.setOptions({ gfm: true, breaks: true });

function esc(s = '') {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// reports/2026-06-15-ivy.md -> 2026-06-15-ivy
function slugFromFile(file) {
  return basename(file, '.md');
}

// Pull a date string (YYYY-MM-DD) from frontmatter or the filename prefix.
function resolveDate(data, slug) {
  if (data.date) {
    // gray-matter may parse an unquoted date into a Date object; normalize.
    const d = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : String(data.date);
    return d.slice(0, 10);
  }
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : '';
}

function loadReports() {
  if (!existsSync(REPORTS_DIR)) return [];
  return readdirSync(REPORTS_DIR)
    .filter((f) => f.endsWith('.md') && f.toLowerCase() !== 'readme.md')
    .map((file) => {
      const slug = slugFromFile(file);
      const raw = readFileSync(join(REPORTS_DIR, file), 'utf8');
      const { data, content } = matter(raw);
      const date = resolveDate(data, slug);
      const author = data.author || data.作者 || '匿名';
      const title = data.title || data.标题 || `${author} 的工作日报`;
      const tags = Array.isArray(data.tags) ? data.tags : (data.tags ? [data.tags] : []);
      return { slug, date, author, title, tags, html: marked.parse(content) };
    })
    .sort((a, b) => (b.date + b.slug).localeCompare(a.date + a.slug));
}

function layout({ title, body, depth = 0 }) {
  const base = depth === 0 ? '' : '../';
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="${base}assets/style.css">
</head>
<body>
<header class="site-header">
  <a class="brand" href="${base}index.html">${esc(ORG_NAME)}</a>
  <nav><a href="${base}index.html">首页</a><a href="${base}index.html#reports">工作日报</a></nav>
</header>
<main>
${body}
</main>
<footer class="site-footer">
  <p>${esc(ORG_TAGLINE)} · 自动由 reports/ 下的 Markdown 生成</p>
</footer>
</body>
</html>`;
}

function reportCard(r) {
  const tags = r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  return `<li class="report-card">
  <a class="report-link" href="reports/${esc(r.slug)}.html">
    <span class="report-date">${esc(r.date || '—')}</span>
    <span class="report-title">${esc(r.title)}</span>
    <span class="report-author">${esc(r.author)}</span>
  </a>
  <div class="report-tags">${tags}</div>
</li>`;
}

function renderIndex(reports) {
  const list = reports.length
    ? `<ul class="report-list">${reports.map(reportCard).join('\n')}</ul>`
    : `<p class="empty">还没有日报。往 <code>reports/</code> 提交一个 Markdown 文件即可发布。</p>`;

  const body = `<section class="hero">
  <h1>${esc(ORG_NAME)}</h1>
  <p class="tagline">${esc(ORG_TAGLINE)}</p>
</section>

<section id="reports" class="reports">
  <div class="section-head">
    <h2>工作日报</h2>
    <span class="count">${reports.length} 篇</span>
  </div>
  ${list}
  <details class="how-to">
    <summary>怎么发一篇日报？</summary>
    <ol>
      <li>在 <code>reports/</code> 下新建文件，命名 <code>YYYY-MM-DD-你的名字.md</code></li>
      <li>顶部写 frontmatter（见下方模板），正文用 Markdown 自由发挥</li>
      <li>提交并推送到 <code>main</code>，Actions 会自动构建并发布到本站</li>
    </ol>
    <pre><code>---
title: 今日进展
author: ivy
date: 2026-06-15
tags: [mobile, backend]
---

## 今天做了什么
- ...

## 遇到的问题 / 明天计划
- ...
</code></pre>
  </details>
</section>`;
  return layout({ title: ORG_NAME, body, depth: 0 });
}

function renderReport(r) {
  const tags = r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
  const body = `<article class="report">
  <a class="back" href="../index.html#reports">← 返回日报列表</a>
  <header class="report-header">
    <h1>${esc(r.title)}</h1>
    <p class="meta"><span>${esc(r.author)}</span> · <time>${esc(r.date || '—')}</time></p>
    <div class="report-tags">${tags}</div>
  </header>
  <div class="report-body">${r.html}</div>
</article>`;
  return layout({ title: `${r.title} · ${ORG_NAME}`, body, depth: 1 });
}

function build() {
  rmSync(DIST, { recursive: true, force: true });
  mkdirSync(join(DIST, 'reports'), { recursive: true });
  if (existsSync(ASSETS_DIR)) cpSync(ASSETS_DIR, join(DIST, 'assets'), { recursive: true });

  const reports = loadReports();
  writeFileSync(join(DIST, 'index.html'), renderIndex(reports));
  for (const r of reports) {
    writeFileSync(join(DIST, 'reports', `${r.slug}.html`), renderReport(r));
  }
  // Pages must not run Jekyll over our pre-built output.
  writeFileSync(join(DIST, '.nojekyll'), '');
  console.log(`Built ${reports.length} report(s) -> dist/`);
}

build();
