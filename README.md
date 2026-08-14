# DSH Workbench

把 DeepSeek Harness 改造成桌面式项目工作台：左侧项目与文件树，中间文件编辑/预览，右侧保留 AI 对话。

> 当前版本面向 **DeepSeek Harness 0.1.0-rc.6**。DSH 仍处于开发预览阶段，升级 DSH 前请先查看兼容性说明。

## 功能

- 多项目侧栏与可折叠文件树
- 文本和代码编辑、Markdown/PDF/图片/音视频预览
- DOCX 与 XLS/XLSX 预览
- 文件新建、重命名、复制、移动、删除和上传
- 打开的文件可作为 AI 对话上下文
- AI 对话固定在右侧，可拖动宽度或折叠
- 项目内历史会话与快速新建对话
- 不修改 DSH 安装目录：通过 Cordis 配置层替换布局

## 安装

发布到 npm 后，只需要安装入口包：

```bash
dsh plugin --profile web add deepseek-harness-workbench
```

从源码本地试用：

```bash
pnpm install
dsh plugin --profile web add ./packages/layout
dsh plugin --profile web add ./packages/ui
dsh --profile web --patch "$PWD/packages/bundle/cordis.patch.yml"
```

最后一条命令会用临时配置层启动工作台。正式发布到 npm 后，安装入口包即可永久写入 profile。若已有同类自定义布局，请先备份配置，避免两个布局同时启用。

## 项目结构

- `packages/bundle`：统一安装入口和 Cordis 配置层
- `packages/layout`：三栏工作台布局，替换 DSH 默认布局
- `packages/ui`：项目、文件、预览、上下文和历史会话界面

之所以拆成三个 npm 包，是因为 DSH 的每个浏览器插件都有独立的 `dsh.client` 清单；对使用者仍然只暴露一个入口包。

## 开发与验证

```bash
pnpm install
pnpm test
```

项目不包含登录凭据、模型密钥、用户会话或项目文件。工作台只访问用户在 DSH 中主动选择的工作区目录。

## 许可证

本项目采用 [MIT License](./LICENSE)。你可以自由使用、修改、分发和商用，也可以用于闭源项目，但必须保留原始版权与许可声明。

布局组件包含对 DeepSeek Harness MIT 代码的修改，归属和原始许可见 [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)。

## 贡献

欢迎提交 Issue 和 Pull Request。提交贡献即表示你有权提交这些代码，并同意以 MIT License 发布。详见 [CONTRIBUTING.md](./CONTRIBUTING.md)。

维护者发布新版本时请按 [RELEASING.md](./RELEASING.md) 的顺序发布三个包。
