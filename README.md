# 健身动作记录 PWA

一个移动端优先的训练记录应用，基于 `React + TypeScript + Vite + IndexedDB + Tailwind CSS`。

## 本地开发

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run build
npm run test
npm run lint
```

## GitHub Pages 部署

这个项目已经为 GitHub Pages 做了两项适配：

- 路由改成了 `HashRouter`，避免刷新子页面时出现 404
- Vite `base` 改成了相对路径，适合仓库子路径部署

部署步骤：

1. 在 GitHub 新建一个仓库。
2. 把当前项目推到该仓库的 `main` 分支。
3. 打开仓库的 `Settings`。
4. 进入 `Pages`。
5. 在 `Build and deployment` 里选择 `GitHub Actions`。
6. 推送代码后，仓库里的 `.github/workflows/deploy.yml` 会自动执行部署。
7. 部署完成后，你会拿到一个类似下面的地址：

```text
https://你的用户名.github.io/你的仓库名/
```

如果仓库是公开仓库，GitHub Pages 通常是最省事的静态托管方案之一。

## PWA 安装

部署到 HTTPS 地址后，可以在手机浏览器里打开站点，再执行：

- Android Chrome：菜单 -> `添加到主屏幕` 或 `安装应用`
- iPhone Safari：分享 -> `添加到主屏幕`

安装后会以接近原生 App 的方式启动，训练数据仍然优先保存在本地 IndexedDB。
