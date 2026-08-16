---
name: dsh-cockpit-install
description: Install, update, verify, or start DeepSeek Harness with the public DSH Cockpit plugin from npm. Use when a user asks to install DSH, install DSH Cockpit, set up the DSH web profile, replace an old private DSH restore workflow, or verify a public installation. Installs DSH 0.1.0-rc.6 and dsh-cockpit 0.2.1 without migrating sessions, settings, projects, credentials, a desktop shell, or patched dependency files.
---

# DSH Cockpit Install

Install the verified public DSH web stack without importing data from another computer.

## Workflow

1. Run `scripts/install_dsh_cockpit.sh --check` and report missing prerequisites.
2. Require Node.js 22 or newer and npm. Help the user install a current Node.js LTS release when needed.
3. When the user asks to install or update, run `scripts/install_dsh_cockpit.sh --install`.
4. Run `scripts/install_dsh_cockpit.sh --verify` after installation.
5. Start DSH only when requested, using `scripts/install_dsh_cockpit.sh --launch`. Keep the resulting server process attached unless the user asks for background operation.

Use `--target-home PATH` for an isolated test or a non-default home directory. Pass web-app arguments after `--` when launching.

## Installed Versions

- `@deepseek-ai/dsh@0.1.0-rc.6`
- `@deepseek-ai/dsh-web-app@0.1.0-rc.6`
- `dsh-cockpit@0.2.1`

The installer uses public npm packages and configures only the `web` profile. It preserves other declared profile packages and approved build dependencies.

## Safety

- Never import or inspect another user's DSH home, sessions, settings, project registry, credentials, or project files.
- Never install the retired desktop launcher or modify files inside DSH dependencies.
- Never copy the former migration payload. This public Skill contains no payload or user data.
- Stop if the installed DSH version cannot be verified as `0.1.0-rc.6`.
- If another custom layout is active, show the composed config and ask the user before removing it.

## Troubleshooting

- If `dsh` is not on `PATH` after installation, use `$HOME/.local/bin/dsh` or add `$HOME/.local/bin` to `PATH`.
- If npm access fails, preserve the existing profile and retry after network or registry access is restored.
- If verification reports missing DSH Cockpit entries, rerun `--install`; the operation is idempotent.
