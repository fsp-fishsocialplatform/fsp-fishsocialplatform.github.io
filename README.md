# fsp-fishsocialplatform.github.io

FSP 组织主页 + 团队工作日报（静态站，自动发布到 GitHub Pages）。

线上地址：https://fsp-fishsocialplatform.github.io/

## 发一篇工作日报

往 [`reports/`](reports/) 提交一个 `YYYY-MM-DD-你的名字.md` 文件，推送到 `main` 即自动构建发布。格式见 [reports/README.md](reports/README.md)。

## 本地预览

```bash
npm install
npm run build
# 打开 dist/index.html，或起个静态服务器：
npx serve dist
```

## 结构

```
reports/        日报 Markdown 源文件（内容就在这里写）
assets/         样式
scripts/build.mjs   零依赖构建脚本：reports/*.md -> dist/ 静态页
.github/workflows/deploy.yml   push 到 main 时构建并部署到 Pages
```

## 首次启用 Pages（仅一次）

仓库 Settings → Pages → Build and deployment → Source 选 **GitHub Actions**。之后每次推送 `main` 自动发布。
