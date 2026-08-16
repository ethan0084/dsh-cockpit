# Security Policy

## Supported version

安全修复目前只覆盖最新发布版本。`0.2.1` 起不再使用 npm 上存在已知漏洞的 `xlsx@0.18.5`，发布包内置 SheetJS 官方 `0.20.3` 模块。

`0.2.2` 修复了一组工作区边界与同源校验问题（终端 `cwd` 越界、部分写操作缺少同源校验、Markdown 链接 XSS、静态资源缺少防嗅探响应头）。使用 `0.2.1` 及更早版本的用户请升级。

## Reporting a vulnerability

请不要在公开 Issue 中披露尚未修复的漏洞。仓库发布后，请通过 GitHub 的 Private vulnerability reporting 提交报告，并附上影响范围、复现步骤和建议缓解方式。

本插件具有用户所选工作区内的文件读写能力。任何绕过工作区边界、任意路径访问、未授权上传或内容注入问题都应按安全漏洞处理。
