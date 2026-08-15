#!/usr/bin/env bash

set -euo pipefail

DSH_VERSION="0.1.0-rc.6"
WEB_APP_VERSION="0.1.0-rc.6"
COCKPIT_VERSION="0.2.0"
MODE="check"
TARGET_HOME="$HOME"
EXTRA_ARGS=()

usage() {
  printf '%s\n' "Usage: install_dsh_cockpit.sh --check|--install|--verify|--launch [--target-home PATH] [-- ARGS...]"
}

while (( $# > 0 )); do
  case "$1" in
    --check) MODE="check" ;;
    --install) MODE="install" ;;
    --verify) MODE="verify" ;;
    --launch) MODE="launch" ;;
    --target-home)
      shift
      (( $# > 0 )) || { printf '%s\n' "Missing value for --target-home" >&2; exit 2; }
      TARGET_HOME="$1"
      ;;
    --)
      shift
      EXTRA_ARGS=("$@")
      break
      ;;
    --help|-h) usage; exit 0 ;;
    *) printf '%s\n' "Unknown argument: $1" >&2; usage; exit 2 ;;
  esac
  shift
done

case "$TARGET_HOME" in
  /*) ;;
  *) TARGET_HOME="$PWD/$TARGET_HOME" ;;
esac

TARGET_DSH="${DSH_HOME:-$TARGET_HOME/.dsh}"
INSTALL_PREFIX="${DSH_INSTALL_PREFIX:-$TARGET_HOME/.local}"

dsh_version() {
  "$1" --version 2>/dev/null | head -1
}

find_dsh() {
  local candidate=""
  if [[ -n "${DSH_BIN:-}" && -x "$DSH_BIN" ]] && [[ "$(dsh_version "$DSH_BIN")" == "$DSH_VERSION" ]]; then
    printf '%s\n' "$DSH_BIN"
    return 0
  fi
  if command -v dsh >/dev/null 2>&1; then
    candidate="$(command -v dsh)"
    if [[ "$(dsh_version "$candidate")" == "$DSH_VERSION" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  fi
  candidate="$INSTALL_PREFIX/bin/dsh"
  if [[ -x "$candidate" && "$(dsh_version "$candidate")" == "$DSH_VERSION" ]]; then
    printf '%s\n' "$candidate"
    return 0
  fi
  return 1
}

require_node() {
  command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1 || {
    printf '%s\n' "Node.js 22 or newer and npm are required." >&2
    return 1
  }
  local major
  major="$(node -p 'Number(process.versions.node.split(".")[0])')"
  (( major >= 22 )) || {
    printf '%s\n' "Node.js 22 or newer is required; found $(node --version)." >&2
    return 1
  }
}

print_check() {
  printf '%s\n' "Installation source: public npm registry"
  printf '%s\n' "DSH home: $TARGET_DSH"
  printf '%s\n' "Private migration data: not included"
  if command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1; then
    printf '%s\n' "Node.js: $(node --version)"
  else
    printf '%s\n' "Node.js: missing (22 or newer required)"
  fi
  local dsh_bin=""
  if dsh_bin="$(find_dsh 2>/dev/null)"; then
    printf '%s\n' "DSH: $DSH_VERSION at $dsh_bin"
  else
    printf '%s\n' "DSH: $DSH_VERSION will be installed into $INSTALL_PREFIX"
  fi
  printf '%s\n' "DSH Cockpit: dsh-cockpit@$COCKPIT_VERSION"
}

ensure_dsh() {
  require_node
  local dsh_bin=""
  if ! dsh_bin="$(find_dsh 2>/dev/null)"; then
    mkdir -p "$INSTALL_PREFIX"
    npm install --global --prefix "$INSTALL_PREFIX" "@deepseek-ai/dsh@$DSH_VERSION" >&2
    dsh_bin="$INSTALL_PREFIX/bin/dsh"
  fi
  [[ -x "$dsh_bin" && "$(dsh_version "$dsh_bin")" == "$DSH_VERSION" ]] || {
    printf '%s\n' "Could not verify DSH $DSH_VERSION." >&2
    return 1
  }
  printf '%s\n' "$dsh_bin"
}

configure_builds() {
  local dsh_bin="$1" current merged
  current="$(DSH_HOME="$TARGET_DSH" "$dsh_bin" plugin --profile web config get --location=project --json allowBuilds 2>/dev/null || printf '{}')"
  merged="$(node -e '
    let value = {};
    try { value = JSON.parse(process.argv[1]); } catch {}
    if (!value || Array.isArray(value) || typeof value !== "object") value = {};
    value.koffi = true;
    process.stdout.write(JSON.stringify(value));
  ' "$current")"
  DSH_HOME="$TARGET_DSH" "$dsh_bin" plugin --profile web config set --location=project --json allowBuilds "$merged" >/dev/null
}

install_public_stack() {
  local dsh_bin
  dsh_bin="$(ensure_dsh)"
  configure_builds "$dsh_bin"
  CI=1 PNPM_DISABLE_SELF_UPDATE_CHECK=1 DSH_HOME="$TARGET_DSH" "$dsh_bin" plugin --profile web add "@deepseek-ai/dsh-web-app@$WEB_APP_VERSION"
  CI=1 PNPM_DISABLE_SELF_UPDATE_CHECK=1 DSH_HOME="$TARGET_DSH" "$dsh_bin" plugin --profile web add "dsh-cockpit@$COCKPIT_VERSION"
  verify_install
}

verify_install() {
  require_node
  local dsh_bin manifest config_file
  dsh_bin="$(find_dsh 2>/dev/null)" || { printf '%s\n' "DSH $DSH_VERSION is not installed." >&2; return 1; }
  manifest="$TARGET_DSH/profiles/web/package.json"
  [[ -f "$manifest" ]] || { printf '%s\n' "Missing web profile: $manifest" >&2; return 1; }
  node - "$manifest" "$WEB_APP_VERSION" "$COCKPIT_VERSION" <<'NODE'
const fs = require("node:fs");
const [manifestPath, webVersion, cockpitVersion] = process.argv.slice(2);
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const dependencies = manifest.dependencies || {};
if (dependencies["@deepseek-ai/dsh-web-app"] !== webVersion) {
  throw new Error(`Expected @deepseek-ai/dsh-web-app@${webVersion}`);
}
if (dependencies["dsh-cockpit"] !== cockpitVersion) {
  throw new Error(`Expected dsh-cockpit@${cockpitVersion}`);
}
NODE
  config_file="$(mktemp "${TMPDIR:-/tmp}/dsh-cockpit-install-config.XXXXXX")"
  trap 'rm -f "$config_file"' RETURN
  DSH_HOME="$TARGET_DSH" "$dsh_bin" --profile web --dump-config >"$config_file"
  grep -Fq "name: dsh-cockpit/layout" "$config_file" || { printf '%s\n' "Missing dsh-cockpit/layout in composed config." >&2; return 1; }
  grep -Fq "name: dsh-cockpit/ui" "$config_file" || { printf '%s\n' "Missing dsh-cockpit/ui in composed config." >&2; return 1; }
  rm -f "$config_file"
  trap - RETURN
  printf '%s\n' "DSH installation verification: OK"
}

case "$MODE" in
  check) print_check ;;
  install) install_public_stack ;;
  verify) verify_install ;;
  launch)
    verify_install
    dsh_bin="$(find_dsh)"
    exec env DSH_HOME="$TARGET_DSH" "$dsh_bin" --profile web "${EXTRA_ARGS[@]}"
    ;;
esac
