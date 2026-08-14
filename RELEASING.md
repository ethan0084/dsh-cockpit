# Releasing

三个包必须保持同一版本，并按依赖顺序发布。

## 发布前

```bash
pnpm install --frozen-lockfile --ignore-scripts
pnpm test
pnpm run pack:all
```

确认 `CHANGELOG.md`、兼容的 DeepSeek Harness 版本和三个 `package.json` 的版本已经更新。不要把个人项目、会话、凭据或本地绝对路径加入发布包。

## npm 发布顺序

```bash
pnpm --filter ethan-workbench-layout publish --no-git-checks
pnpm --filter ethan-workbench-ui publish --no-git-checks
pnpm --filter ethan-workbench publish --no-git-checks
```

入口包依赖前两个组件，因此必须最后发布。首次正式发布前，再次确认三个 npm 名称仍然可用；查询结果不等于名称预留。

## 发布后验证

在新的 DSH profile 中运行：

```bash
dsh plugin --profile web add ethan-workbench
dsh --profile web --dump-config
```

确认 `ui-layout` 与 `ui-workspace` 已停用，并且 `workbench-layout`、`workbench-ui` 已出现，然后启动网页完成一次视觉检查。
