# Releasing

从 `0.1.1` 起只发布 `ethan-workbench` 入口包。布局和界面源码会在打包时内嵌为入口包的公开子路径，不再单独发布组件包。

## 发布前

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm run pack:release
```

确认 `CHANGELOG.md`、兼容的 DeepSeek Harness 版本和 `packages/bundle/package.json` 的版本已经更新。检查生成的 tarball 中包含 `embedded/layout` 与 `embedded/ui`。不要把个人项目、会话、凭据或本地绝对路径加入发布包。

## npm 发布

```bash
npm publish ./dist/ethan-workbench-X.Y.Z.tgz --access public
```

发布需要 npm 账户的写入验证；使用已配置的通行密钥或其他双重验证方式完成确认。发布后检查 `latest` 是否指向新版本。

## 发布后验证

在新的 DSH profile 中运行：

```bash
dsh plugin --profile web add ethan-workbench
dsh --profile web --dump-config
dsh --profile web
```

确认 `ui-layout` 与 `ui-workspace` 已停用，`workbench-layout`、`workbench-ui` 分别指向 `ethan-workbench/layout`、`ethan-workbench/ui`，然后启动网页完成一次视觉检查并确认浏览器控制台无报错。
