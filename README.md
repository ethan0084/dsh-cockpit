# DSH Cockpit

把 DeepSeek Harness 改造成桌面式项目工作台：左侧项目与文件树，中间文件编辑/预览，右侧保留 AI 对话。

> 当前版本面向 **DeepSeek Harness 0.1.0-rc.6**。DSH 仍处于开发预览阶段，升级 DSH 前请先查看兼容性说明。

<img width="1283" height="862" alt="image" src="https://github.com/user-attachments/assets/e9dcd44f-16f3-4f23-9c51-fcdbf9fe1da3" />

## 功能

- 多项目侧栏与可折叠文件树
- 文本和代码编辑、Markdown/PDF/图片/音视频预览；文件树单击复用预览标签，双击固定
- DOCX 与 XLS/XLSX 预览
- 文件新建、重命名、复制、移动、删除和上传
- 打开的文件可作为 AI 对话上下文
- 从 AI 对话打开的工作区文件会固定到新的中部标签页
- AI 对话固定在右侧，可拖动宽度或折叠
- 项目内历史会话与快速新建对话
- 中部预览区下方可展开项目终端，在当前项目目录运行命令并保留 `cd` 后的路径
- 不修改 DSH 安装目录：通过 Cordis 配置层替换布局

> 平台说明：终端在 Windows 与类 Unix 系统上均可用；「在 Finder 中显示」依赖 macOS 的 `open -R`，其他平台调用会失败。

## 安装

已发布到 npm，只需要安装一个入口包：

```bash
dsh plugin --profile web add dsh-cockpit
```

从源码本地试用（`pack:release` 依赖 `pnpm install` 装好的 `xlsx`，请按顺序执行）：

```bash
pnpm install
pnpm test
pnpm run pack:release
dsh plugin --profile web add "$PWD"/dist/dsh-cockpit-*.tgz
dsh --profile web
```

安装命令会把 Cordis 配置层永久写入 `web` profile。若已有同类自定义布局，请先备份配置，避免两个布局同时启用。

### 卸载与回滚

移除插件并恢复 DSH 默认布局：

```bash
dsh plugin --profile web remove dsh-cockpit
dsh --profile web --dump-config   # 确认 ui-layout / ui-workspace 不再是 disabled
```

若只想临时停用，可直接编辑 profile 的 `cordis.patch.yml`。安装前备份 `~/.dsh/profiles/web/` 可以最快回到原状。

### 故障排查

| 现象 | 原因与处理 |
| --- | --- |
| `dsh: pnpm not found on PATH` | DSH 通过 pnpm 管理 profile 插件。用 `corepack enable pnpm` 启用即可 |
| `ERR_PNPM_ADDING_TO_ROOT` | pnpm 10 对 workspace 根目录的保护。改为在 profile 的 `package.json` 中直接写入版本后运行 `pnpm install` |
| `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY` | 当前 pnpm 与建立 `node_modules` 的版本不一致。用原版本安装（本项目为 `pnpm@11.19.0`），避免整棵依赖树被重建 |
| 页面空白或布局未替换 | 用 `dsh --profile web --dump-config` 确认 `cockpit-layout`、`cockpit-ui` 已存在且 `ui-layout`、`ui-workspace` 为 `disabled: true` |
| 预览 DOCX/XLSX 报错 | 单个文件超过 25 MB 上限，或文件本身损坏 |

### 使用 Codex Skill 安装（可选）

仓库提供了公开版 `dsh-cockpit-install` Skill。它会从 npm 安装并验证 DSH 0.1.0-rc.6 与 DSH Cockpit，不包含会话、设置、项目、凭据、桌面端外壳或私人迁移数据。

在 Codex 中调用 `$skill-installer`，并发送：

```text
请从 https://github.com/ethan0084/dsh-cockpit/tree/main/skills/dsh-cockpit-install 安装 Skill
```

也可以手动安装到个人 Skill 目录：

```bash
git clone https://github.com/ethan0084/dsh-cockpit.git
mkdir -p "$HOME/.agents/skills"
cp -R dsh-cockpit/skills/dsh-cockpit-install "$HOME/.agents/skills/dsh-cockpit-install"
```

安装后可在 Codex 中发送：

```text
$dsh-cockpit-install 安装并启动 DSH 和 DSH Cockpit
```

Codex 通常会自动发现新安装的 Skill；若没有出现，请重启 Codex。

## 项目结构

- `packages/bundle`：唯一发布入口、Cordis 配置层和打包后的内嵌组件
- `packages/layout`：三栏工作台布局源码，替换 DSH 默认布局
- `packages/ui`：项目、文件、预览、上下文和历史会话源码
- `scripts/build-bundle.mjs`：发布前把布局与界面源码组装进入口包
- `skills/dsh-cockpit-install`：从公开 npm 包安装、验证和启动 DSH 工作台的 Codex Skill

`dsh-cockpit` 采用单入口内嵌结构。布局和界面通过 `dsh-cockpit/layout`、`dsh-cockpit/ui` 子路径包含在同一个 npm 包中，避免 pnpm 隔离依赖导致 DSH 无法加载组件。

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

维护者发布新版本时请按 [RELEASING.md](./RELEASING.md) 打包、发布并完成全新 profile 验证。
