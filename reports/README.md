# 工作日报 reports/

每篇日报是这个目录下的一个 Markdown 文件。提交并推送到 `release` 后，GitHub Actions 会自动构建并发布到组织主页。

## 怎么发一篇

1. 复制命名格式新建文件：`YYYY-MM-DD-你的名字.md`，例如 `2026-06-15-ivy.md`
2. 文件顶部写 frontmatter，正文用 Markdown 自由发挥
3. `git add` → `git commit` → `git push origin release`，剩下交给 CI

## 模板

```markdown
---
title: 今日进展
author: ivy
date: 2026-06-15
tags: [mobile, backend]
---

## 今天做了什么
- ...

## 遇到的问题 / 明天计划
- ...
```

## 字段说明

| 字段 | 必填 | 说明 |
| --- | --- | --- |
| `title` | 否 | 日报标题，留空则用「<作者> 的工作日报」 |
| `author` | 建议 | 作者名，列表和详情页都会显示 |
| `date` | 否 | `YYYY-MM-DD`；留空则从文件名前缀自动识别 |
| `tags` | 否 | 字符串数组，渲染成标签 |

> 文件名前缀的日期既用于排序，也是 `date` 缺省时的回退来源，所以**务必按 `YYYY-MM-DD-` 开头命名**。
