/* DSH Cockpit UI. Copyright (C) 2026 DSH Cockpit contributors. MIT License. */
window.__ModuleLoader__.load({
  id: "dsh-cockpit-ui",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
    const React = require("react");
    const ReactDOM = require("react-dom");
    const h = React.createElement;

    const API = "/dsh-workspace/api";
    const ASSET = "/dsh-workspace/asset";
    const bus = new EventTarget();
    const snapshots = new Map();
    const forcedHidden = new Set(["node_modules", ".git", "dist", "build", ".next", ".cache", "coverage", "vendor"]);
    const textExtensions = new Set([
      "md", "mdx", "txt", "json", "jsonl", "yaml", "yml", "toml", "xml", "html", "htm", "css", "scss", "less",
      "js", "jsx", "mjs", "cjs", "ts", "tsx", "vue", "svelte", "py", "rb", "go", "rs", "swift", "java", "kt",
      "c", "h", "cpp", "hpp", "cs", "php", "sh", "zsh", "bash", "fish", "sql", "graphql", "ini", "conf", "env",
      "gitignore", "dockerfile", "makefile", "csv", "log"
    ]);
    const videoExtensions = new Set(["mp4", "mov", "webm"]);
    const audioExtensions = new Set(["mp3", "wav", "m4a"]);
    const imageExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg"]);
    const officeExtensions = new Set(["docx", "xlsx", "xls"]);

    const css = `
      .dwu-root,.dwu-root *{box-sizing:border-box}.dwu-root{height:100%;min-height:0;color:var(--dsw-alias-label-primary);font-family:Inter,var(--dsw-font-family),-apple-system,BlinkMacSystemFont,sans-serif}
      .dwu-sidebar{display:grid;grid-template-columns:48px minmax(0,1fr);height:100%;min-height:0;background:var(--dsw-specific-sidebar-fill);overflow:hidden}.dwu-sidebar[data-collapsed=true]{grid-template-columns:36px 0}.dwu-projects{border-right:1px solid var(--dsw-alias-border-l1);padding:8px 6px;display:flex;flex-direction:column;align-items:center;gap:7px;overflow-y:auto}.dwu-projectButton,.dwu-addProject{width:36px;height:36px;flex:none;border:0;border-radius:10px;display:grid;place-items:center;cursor:pointer;color:var(--dsw-alias-label-secondary);background:transparent;font-size:12px;font-weight:650}.dwu-projectButton:hover,.dwu-addProject:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-projectButton[data-active=true]{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary);box-shadow:inset 2px 0 0 var(--dsw-alias-state-business-primary)}.dwu-addProject{margin-top:auto;font-size:20px;font-weight:400}.dwu-treePanel{min-width:0;min-height:0;display:flex;flex-direction:column;overflow:hidden}.dwu-treeHead{height:42px;flex:none;display:flex;align-items:center;gap:7px;padding:0 8px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}.dwu-treeTitle{min-width:0;flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:650;text-transform:uppercase;letter-spacing:.04em}.dwu-iconButton{width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;display:grid;place-items:center}.dwu-iconButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-tree{flex:1;min-height:0;overflow:auto;padding:6px 4px 16px}.dwu-emptySide{padding:18px 12px;color:var(--dsw-alias-label-tertiary);font-size:12px;line-height:1.55}.dwu-treeRow{height:28px;display:flex;align-items:center;gap:5px;border-radius:6px;padding-right:5px;cursor:pointer;font-size:12px;white-space:nowrap;user-select:none}.dwu-treeRow:hover{background:var(--dsw-alias-interactive-bg-hover)}.dwu-treeRow[data-active=true]{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-label-primary-bluish)}.dwu-chevron{width:14px;flex:none;text-align:center;color:var(--dsw-alias-label-caption);font-size:10px}.dwu-fileGlyph{width:15px;flex:none;text-align:center;color:var(--dsw-alias-label-secondary)}.dwu-treeName{min-width:0;overflow:hidden;text-overflow:ellipsis}.dwu-treeLoading{padding:8px 10px;color:var(--dsw-alias-label-caption);font-size:11px}
      .dwu-workspace{height:100%;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base)}.dwu-workHead{height:42px;flex:none;display:flex;align-items:center;gap:8px;padding:0 52px 0 12px;border-bottom:1px solid var(--dsw-alias-border-l1)}.dwu-workTitle{font-size:12px;font-weight:650;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dwu-workPath{font-size:11px;color:var(--dsw-alias-label-caption);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dwu-tabs{height:38px;flex:none;display:flex;align-items:stretch;overflow-x:auto;border-bottom:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}.dwu-tab{min-width:110px;max-width:210px;border:0;border-right:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:7px;padding:0 7px 0 11px;cursor:pointer;font-size:12px}.dwu-tab[data-active=true]{background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);box-shadow:inset 0 -2px 0 var(--dsw-alias-state-business-primary)}.dwu-tabName{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dwu-dirty{color:var(--dsw-alias-state-business-primary);font-size:14px}.dwu-close{width:20px;height:20px;border:0;background:transparent;border-radius:5px;color:inherit;cursor:pointer;padding:0}.dwu-close:hover{background:var(--dsw-alias-interactive-bg-hover)}.dwu-body{flex:1;min-height:0;position:relative;overflow:hidden}.dwu-welcome{height:100%;display:grid;place-items:center;padding:32px;color:var(--dsw-alias-label-tertiary);text-align:center}.dwu-welcomeCard{max-width:430px}.dwu-welcomeIcon{font-size:38px;margin-bottom:12px}.dwu-welcomeTitle{color:var(--dsw-alias-label-primary);font-size:18px;font-weight:650;margin-bottom:7px}.dwu-welcomeText{font-size:13px;line-height:1.6}.dwu-filePane{height:100%;min-height:0;display:flex;flex-direction:column}.dwu-fileToolbar{height:36px;flex:none;border-bottom:1px solid var(--dsw-alias-border-l1);display:flex;align-items:center;gap:6px;padding:0 10px}.dwu-fileMeta{min-width:0;flex:1;color:var(--dsw-alias-label-caption);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dwu-toolButton{height:26px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);padding:0 9px;font-size:11px;cursor:pointer}.dwu-toolButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-toolButton:disabled{opacity:.45;cursor:default}.dwu-status{font-size:11px;color:var(--dsw-alias-label-caption)}.dwu-status[data-error=true]{color:var(--dsw-alias-state-error-primary)}.dwu-editorWrap{flex:1;min-height:0;display:flex;overflow:hidden;background:var(--dsw-alias-bg-base)}.dwu-lines{width:48px;flex:none;margin:0;padding:14px 10px 40px 0;text-align:right;overflow:hidden;white-space:pre;color:var(--dsw-alias-label-caption);background:var(--dsw-specific-sidebar-fill);border-right:1px solid var(--dsw-alias-border-l1);font:12px/20px ui-monospace,SFMono-Regular,Menlo,monospace;user-select:none}.dwu-codeArea{flex:1;min-width:0;min-height:0;position:relative;overflow:hidden}.dwu-highlight,.dwu-editor{position:absolute;inset:0;margin:0;border:0;padding:14px 18px 40px;font:13px/20px ui-monospace,SFMono-Regular,Menlo,monospace;tab-size:2;white-space:pre;overflow:auto}.dwu-highlight{pointer-events:none;color:var(--dsw-alias-label-primary);background:transparent;overflow:hidden}.dwu-highlight .kw{color:#c792ea}.dwu-highlight .str{color:#c3e88d}.dwu-highlight .num{color:#f78c6c}.dwu-highlight .com{color:var(--dsw-alias-label-caption);font-style:italic}.dwu-editor{width:100%;height:100%;resize:none;outline:0;background:transparent;color:var(--dsw-alias-label-primary);caret-color:var(--dsw-alias-state-business-primary)}.dwu-editor[data-highlight=true]{color:transparent;-webkit-text-fill-color:transparent}.dwu-editor[data-highlight=true]::selection{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 35%,transparent)}.dwu-editor[data-flash=true]{animation:dwu-flash .9s ease-out}@keyframes dwu-flash{0%{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 13%,transparent)}100%{background:transparent}}.dwu-preview{height:100%;overflow:auto;padding:28px clamp(24px,7vw,84px);font-size:14px;line-height:1.72}.dwu-preview h1,.dwu-preview h2,.dwu-preview h3{line-height:1.25;margin:1.3em 0 .55em}.dwu-preview h1{font-size:28px}.dwu-preview h2{font-size:22px;border-bottom:1px solid var(--dsw-alias-border-l1);padding-bottom:7px}.dwu-preview pre{background:var(--dsw-specific-sidebar-fill);border:1px solid var(--dsw-alias-border-l1);border-radius:10px;padding:14px;overflow:auto}.dwu-preview code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--dsw-specific-sidebar-fill);border-radius:4px;padding:1px 4px}.dwu-preview blockquote{border-left:3px solid var(--dsw-alias-state-business-primary);margin-left:0;padding-left:14px;color:var(--dsw-alias-label-secondary)}.dwu-preview a{color:var(--dsw-alias-state-business-primary)}.dwu-frame{width:100%;height:100%;border:0;background:white}.dwu-media{height:100%;display:grid;place-items:center;padding:24px;background:#0e1015}.dwu-media video,.dwu-media audio{max-width:100%;max-height:100%}.dwu-media img{max-width:100%;max-height:100%;object-fit:contain}.dwu-office{height:100%;display:flex;flex-direction:column}.dwu-sheetTabs{height:36px;display:flex;align-items:center;gap:5px;padding:0 8px;border-bottom:1px solid var(--dsw-alias-border-l1);overflow-x:auto}.dwu-sheetTab{height:25px;padding:0 9px;border:0;border-radius:6px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer}.dwu-sheetTab[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-loading,.dwu-error{height:100%;display:grid;place-items:center;padding:28px;color:var(--dsw-alias-label-tertiary);font-size:13px}.dwu-error{color:var(--dsw-alias-state-error-primary)}
      .dwu-tab[data-preview=true] .dwu-tabName{font-style:italic}.dwu-workPath{flex:1}.dwu-main{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}.dwu-terminalToggle{width:30px;height:28px;flex:none;display:grid;place-items:center;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;padding:0;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}.dwu-terminalToggle:hover,.dwu-terminalToggle[data-active=true]{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.dwu-terminalGlyph{font:700 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace}.dwu-terminal{height:230px;min-height:150px;max-height:48%;flex:none;display:flex;flex-direction:column;border-top:1px solid var(--dsw-alias-border-l2);background:#101216;color:#d7dce5}.dwu-terminalHead{height:34px;flex:none;display:flex;align-items:center;gap:7px;padding:0 9px 0 12px;background:#171a20;border-bottom:1px solid #ffffff12}.dwu-terminalCwd{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#7f8998}.dwu-terminalAction{height:23px;border:0;border-radius:5px;padding:0 7px;background:transparent;color:#8993a3;font-size:10px;cursor:pointer}.dwu-terminalAction:hover{background:#ffffff12;color:#e7ebf2}.dwu-terminalOutput{flex:1;min-height:0;margin:0;padding:10px 13px;overflow:auto;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/18px ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;color:#cfd6e2;user-select:text}.dwu-terminalEntry{margin:0 0 8px}.dwu-terminalCommand{color:#f0f3f8}.dwu-terminalPrompt{color:#63d297}.dwu-terminalResult[data-error=true]{color:#ff9b9b}.dwu-terminalForm{height:38px;flex:none;display:flex;align-items:center;gap:8px;padding:0 12px;border-top:1px solid #ffffff12;background:#13161b}.dwu-terminalInput{min-width:0;flex:1;border:0;outline:0;background:transparent;color:#f2f4f8;font:12px/1 ui-monospace,SFMono-Regular,Menlo,Monaco,monospace}.dwu-terminalInput::placeholder{color:#657080}.dwu-terminalInput:disabled{opacity:.58}.dwu-terminalRunning{font:10px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#8fa0b8}
      .dwu-contextDock{width:calc(100% - 32px);max-width:var(--dsh-composer-card-max-width);margin:0 auto -3px;padding:0 6px;display:flex;align-items:center;gap:6px;overflow-x:auto}.dwu-contextLabel{font-size:10px;color:var(--dsw-alias-label-caption);white-space:nowrap}.dwu-chip{height:25px;max-width:170px;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:13px;background:var(--dsw-specific-tip);color:var(--dsw-alias-label-secondary);display:flex;align-items:center;gap:5px;padding:0 8px;font-size:10px;cursor:pointer}.dwu-chip[data-enabled=false]{opacity:.48}.dwu-chipName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dwu-chipDot{width:7px;height:7px;border-radius:50%;background:var(--dsw-alias-state-business-primary)}.dwu-chip[data-enabled=false] .dwu-chipDot{background:var(--dsw-alias-label-caption)}.dwu-sessionSwitch{display:flex;align-items:center;gap:4px}.dwu-sessionSelect{height:28px;max-width:150px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);font-size:11px;padding:0 7px}.dwu-sessionNew{width:28px;height:28px;border:0;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:18px;cursor:pointer}.dwu-sessionNew:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dwu-tree{padding:7px 5px 18px}.dwu-treeRow{height:32px;gap:4px;padding:0 6px 0 4px;border-radius:7px;font-size:12.5px}.dwu-indentGuides{align-self:stretch;display:grid;grid-auto-flow:column;grid-auto-columns:18px;flex:none}.dwu-indentGuide{height:100%;position:relative}.dwu-indentGuide:after{content:"";position:absolute;top:0;bottom:0;left:8px;width:1px;background:color-mix(in srgb,var(--dsw-alias-label-caption) 38%,transparent)}.dwu-treeRow:hover .dwu-indentGuide:after,.dwu-treeRow[data-active=true] .dwu-indentGuide:after{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 52%,transparent)}.dwu-chevron{width:18px;font-size:13px;line-height:18px}.dwu-fileGlyph{width:19px;height:19px;display:grid;place-items:center;flex:none}.dwu-vscodeIcon{width:18px;height:18px;display:block;overflow:visible}.dwu-treeName{line-height:20px}.dwu-treeRow .dwu-iconButton{opacity:0}.dwu-treeRow:hover .dwu-iconButton,.dwu-treeRow:focus-within .dwu-iconButton{opacity:1}.dwu-treeLoading{font-size:12px;line-height:24px}.dwu-projectButton,.dwu-addProject{position:relative}.dwu-projectButton:active,.dwu-addProject:active,.dwu-iconButton:active{transform:scale(.96)}
      .dwu-contextMenu{position:fixed;z-index:1000;width:218px;max-height:calc(100vh - 12px);overflow-y:auto;padding:5px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:10px;box-shadow:0 12px 34px #00000033;color:var(--dsw-alias-label-primary)}.dwu-menuItem{width:100%;min-height:32px;border:0;border-radius:6px;padding:0 9px;display:flex;align-items:center;gap:9px;text-align:left;background:transparent;color:inherit;font-size:12px;cursor:pointer}.dwu-menuItem:hover,.dwu-menuItem:focus-visible{outline:0;background:var(--dsw-alias-interactive-bg-hover)}.dwu-menuItem[data-danger=true]{color:var(--dsw-alias-state-error-primary)}.dwu-menuIcon{width:25px;flex:none;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:10px}.dwu-menuSeparator{height:1px;margin:4px 5px;background:var(--dsw-alias-border-l1)}
      .dwu-contextDock{width:calc(100% - 24px);min-height:35px;flex:0 0 auto;margin:0 auto 4px;padding:4px 5px;display:flex;align-content:flex-start;align-items:center;flex-wrap:wrap;gap:5px;max-height:88px;overflow-x:hidden;overflow-y:auto;position:relative;z-index:2}.dwu-contextLabel{height:27px;display:flex;align-items:center;font-size:10px;line-height:16px;flex:none}.dwu-chip{height:27px;min-height:27px;max-width:min(210px,calc(100% - 74px));padding:0 7px 0 8px;gap:6px;border-radius:7px;line-height:16px}.dwu-chip:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l3)}.dwu-chipName{min-width:0;flex:1;display:block;line-height:16px}.dwu-chipRemove{font-size:14px;line-height:16px;color:var(--dsw-alias-label-caption)}.dwu-chip:hover .dwu-chipRemove{color:var(--dsw-alias-label-primary)}
      .dwu-projectButton[data-long=true]{font-size:9px;letter-spacing:-.03em;padding:0 2px}.dwu-historyRoot{position:relative;display:flex;align-items:center;gap:6px}.dwu-historyRoot[data-session=true]{transform:translateX(-126px)}.dwu-historyButton,.dwu-newChatButton{width:34px;height:34px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);display:grid;place-items:center;cursor:pointer;box-shadow:0 2px 8px #0000001a;transition:transform 140ms cubic-bezier(.23,1,.32,1),background-color 140ms ease,color 140ms ease,border-color 140ms ease}.dwu-historyButton:hover,.dwu-historyButton[data-open=true],.dwu-newChatButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary);border-color:var(--dsw-alias-border-l3)}.dwu-historyButton:active,.dwu-newChatButton:active{transform:scale(.96)}.dwu-historyIcon,.dwu-newChatIcon{width:18px;height:18px;display:block}.dwu-historyPopover{position:absolute;top:40px;right:0;width:260px;max-height:min(420px,calc(100vh - 76px));display:flex;flex-direction:column;padding:6px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:11px;box-shadow:0 14px 38px #0000003d;transform-origin:top right}.dwu-historyRoot[data-session=true] .dwu-historyPopover{right:-126px}.dwu-historyHead{height:34px;display:flex;align-items:center;gap:7px;padding:0 5px 0 8px;border-bottom:1px solid var(--dsw-alias-border-l1)}.dwu-historyTitle{min-width:0;flex:1;font-size:12px;font-weight:650;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.dwu-historyCount{font-size:10px;color:var(--dsw-alias-label-caption)}.dwu-historyList{min-height:0;overflow-y:auto;padding-top:5px}.dwu-historyEmpty{padding:18px 10px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:11px}.dwu-historyRow{width:100%;min-height:46px;border:0;border-radius:7px;padding:6px 8px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:3px 8px;text-align:left;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}.dwu-historyRow:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-historyRow[data-active=true]{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-label-primary-bluish)}.dwu-historyName{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px}.dwu-historyTime{font-size:10px;color:var(--dsw-alias-label-caption);white-space:nowrap}.dwu-historyCurrent{grid-column:1/-1;font-size:9px;color:var(--dsw-alias-state-business-primary)}
      .dwu-markOverlay{position:fixed;z-index:1200;inset:0;display:grid;place-items:center;padding:20px;background:#00000042}.dwu-markDialog{width:min(320px,calc(100vw - 40px));padding:16px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:13px;box-shadow:0 18px 54px #0000004d}.dwu-markTitle{font-size:14px;font-weight:680;margin-bottom:4px}.dwu-markProject{font-size:11px;color:var(--dsw-alias-label-caption);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.dwu-markEditor{display:flex;align-items:center;gap:12px;margin:16px 0 8px}.dwu-markPreview{width:44px;height:44px;flex:none;border-radius:11px;display:grid;place-items:center;background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-state-business-primary);font-size:11px;font-weight:700}.dwu-markInput{height:38px;min-width:0;flex:1;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);padding:0 10px;font-size:14px;outline:0}.dwu-markInput:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent)}.dwu-markHint{font-size:10px;color:var(--dsw-alias-label-caption);line-height:1.45}.dwu-markActions{display:flex;justify-content:flex-end;gap:7px;margin-top:15px}.dwu-markAction{height:31px;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;padding:0 11px;background:transparent;color:var(--dsw-alias-label-secondary);font-size:11px;cursor:pointer}.dwu-markAction:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-markAction[data-primary=true]{border-color:var(--dsw-alias-state-business-primary);background:var(--dsw-alias-state-business-primary);color:white}.dwu-markAction:active{transform:scale(.97)}
      .dwu-projectActionText{margin:14px 0 4px;color:var(--dsw-alias-label-secondary);font-size:12px;line-height:1.55}.dwu-projectActionPath{padding:8px 9px;border-radius:7px;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-caption);font:10px/1.45 ui-monospace,SFMono-Regular,Menlo,monospace;overflow-wrap:anywhere}.dwu-projectActionError{margin-top:10px;padding:7px 9px;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);font-size:10px;line-height:1.45}.dwu-markAction[data-danger=true]{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-state-error-primary);color:white}.dwu-markAction:disabled{opacity:.48;cursor:default;transform:none}
      .dwu-projectPicker{position:fixed;z-index:1100;width:300px;max-height:min(430px,calc(100vh - 20px));display:flex;flex-direction:column;padding:6px;background:var(--dsw-alias-bg-base);border:1px solid var(--dsw-alias-border-l2);border-radius:12px;box-shadow:0 16px 46px #00000040;color:var(--dsw-alias-label-primary);transform-origin:top left}.dwu-projectPickerHead{height:34px;flex:none;display:flex;align-items:center;padding:0 9px;color:var(--dsw-alias-label-tertiary);font-size:11px;font-weight:650;border-bottom:1px solid var(--dsw-alias-border-l1)}.dwu-projectPickerList{min-height:0;overflow-y:auto;padding:5px 0}.dwu-projectPickerEmpty{padding:18px 10px;text-align:center;color:var(--dsw-alias-label-tertiary);font-size:11px}.dwu-projectPickerRow{width:100%;min-height:43px;border:0;border-radius:8px;padding:6px 8px;display:grid;grid-template-columns:22px minmax(0,1fr) 18px;align-items:center;gap:7px;text-align:left;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}.dwu-projectPickerRow:hover,.dwu-projectPickerRow:focus-visible{outline:0;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-projectPickerRow[data-selected=true]{background:var(--dsw-alias-state-business-tertiary);color:var(--dsw-alias-label-primary-bluish)}.dwu-projectPickerFolder{width:20px;height:20px;display:grid;place-items:center}.dwu-projectPickerMeta{min-width:0;display:grid}.dwu-projectPickerName{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;font-weight:580}.dwu-projectPickerPath{margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-caption);font-size:9px}.dwu-projectPickerCheck{color:var(--dsw-alias-state-business-primary);font-size:13px;text-align:center}.dwu-projectPickerActions{flex:none;padding:6px 0 0;border-top:1px solid var(--dsw-alias-border-l1)}.dwu-projectPickerAction{width:100%;height:34px;border:0;border-radius:8px;padding:0 9px;display:flex;align-items:center;gap:9px;text-align:left;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer}.dwu-projectPickerAction:hover,.dwu-projectPickerAction:focus-visible{outline:0;background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-projectPickerAction:active,.dwu-projectPickerRow:active{transform:scale(.985)}.dwu-projectPickerAction:disabled{opacity:.45;cursor:progress;transform:none}.dwu-projectPickerActionIcon{width:20px;height:20px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary);font-size:14px}.dwu-projectPickerError{margin:4px 6px 6px;padding:7px 8px;border-radius:7px;background:color-mix(in srgb,var(--dsw-alias-state-error-primary) 12%,transparent);color:var(--dsw-alias-state-error-primary);font-size:10px;line-height:1.4}.dwu-newProjectDialog{width:min(390px,calc(100vw - 40px))}.dwu-newProjectFields{display:grid;gap:13px;margin-top:16px}.dwu-newProjectLabel{display:grid;gap:6px;color:var(--dsw-alias-label-secondary);font-size:11px}.dwu-newProjectInput{height:40px;width:100%;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-specific-sidebar-fill);color:var(--dsw-alias-label-primary);padding:0 11px;font-size:13px;outline:0}.dwu-newProjectInput:focus{border-color:var(--dsw-alias-state-business-primary);box-shadow:0 0 0 2px color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent)}.dwu-newProjectLocation{min-height:42px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-specific-sidebar-fill);display:flex;align-items:center;gap:8px;padding:6px 7px 6px 10px}.dwu-newProjectLocationPath{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-caption);font:10px/1.4 ui-monospace,SFMono-Regular,Menlo,monospace}.dwu-newProjectLocationButton{height:28px;flex:none;border:1px solid var(--dsw-alias-border-l2);border-radius:7px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-secondary);padding:0 9px;font-size:10px;cursor:pointer}.dwu-newProjectLocationButton:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.dwu-newProjectHint{color:var(--dsw-alias-label-caption);font-size:10px;line-height:1.45}
      .dwu-treeRow[data-selected=true]:not([data-active=true]){background:color-mix(in srgb,var(--dsw-alias-label-primary) 7%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--dsw-alias-label-caption) 35%,transparent)}.dwu-treeRow[data-cut=true]{opacity:.48}.dwu-treeRow[data-drop=true]{background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 18%,transparent);box-shadow:inset 0 0 0 1px var(--dsw-alias-state-business-primary)}.dwu-treeRow:focus-visible{outline:1px solid var(--dsw-alias-state-business-primary);outline-offset:-1px}.dwu-tree[data-drop-root=true]{box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary);background:color-mix(in srgb,var(--dsw-alias-state-business-primary) 6%,transparent)}.dwu-tree[data-busy=true]{cursor:progress}.dwu-fileNotice{position:absolute;left:8px;right:8px;bottom:8px;z-index:8;min-height:34px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l2);border-radius:9px;background:var(--dsw-alias-button-floating-fill);box-shadow:0 8px 24px #0000002e;color:var(--dsw-alias-label-secondary);font-size:11px;line-height:1.45;pointer-events:none}.dwu-treePanel{position:relative}.dwu-treeDropHint{padding:10px 12px;color:var(--dsw-alias-state-business-primary);font-size:11px;text-align:center;border-bottom:1px solid var(--dsw-alias-border-l1)}
      .dwu-historyButton:disabled{opacity:.45;cursor:default;transform:none}
      @media (prefers-reduced-motion:reduce){.dwu-projectButton:active,.dwu-addProject:active,.dwu-iconButton:active,.dwu-projectPickerAction:active,.dwu-projectPickerRow:active,.dwu-historyButton:active,.dwu-newChatButton:active{transform:none}}
    `;
    const styleId = "dsh-cockpit-ui/styles";
    if (document.querySelector(`style[data-plugin-css=${JSON.stringify(styleId)}]`) === null) {
      const tag = document.createElement("style");
      tag.dataset.plugin = "dsh-cockpit-ui";
      tag.dataset.pluginCss = styleId;
      tag.textContent = css;
      document.head.appendChild(tag);
    }

    function extOf(file) {
      const name = file.split("/").pop().toLowerCase();
      if (name === "dockerfile" || name === "makefile") return name;
      const at = name.lastIndexOf(".");
      return at < 0 ? "" : name.slice(at + 1);
    }
    function fileKind(file) {
      const ext = extOf(file);
      if (ext === "md" || ext === "mdx") return "markdown";
      if (textExtensions.has(ext) || (!file.split("/").pop().includes(".") && file.split("/").pop().length < 40)) return "text";
      if (ext === "pdf") return "pdf";
      if (videoExtensions.has(ext)) return "video";
      if (audioExtensions.has(ext)) return "audio";
      if (imageExtensions.has(ext)) return "image";
      if (officeExtensions.has(ext)) return "office";
      return "other";
    }
    function fileIconSpec(file) {
      const ext = extOf(file);
      const name = basename(file).toLowerCase();
      if (["js", "jsx", "mjs", "cjs"].includes(ext)) return ["JS", "#d6ba32"];
      if (["ts", "tsx"].includes(ext)) return ["TS", "#3178c6"];
      if (["html", "htm"].includes(ext)) return ["<>", "#e44d26"];
      if (["css", "scss", "less"].includes(ext)) return ["#", "#42a5d9"];
      if (["md", "mdx"].includes(ext)) return ["M", "#519aba"];
      if (["json", "jsonl"].includes(ext)) return ["{}", "#c9a227"];
      if (["yaml", "yml", "toml", "ini", "conf", "env"].includes(ext)) return ["Y", "#cb575d"];
      if (ext === "py") return ["Py", "#3776ab"];
      if (ext === "swift") return ["S", "#f05138"];
      if (ext === "go") return ["Go", "#00add8"];
      if (ext === "rs") return ["Rs", "#a65f38"];
      if (["java", "kt"].includes(ext)) return [ext === "kt" ? "K" : "J", "#e76f00"];
      if (["c", "h", "cpp", "hpp", "cs"].includes(ext)) return [ext.toUpperCase().slice(0, 2), "#659ad2"];
      if (["sh", "zsh", "bash", "fish"].includes(ext)) return [">_", "#4d9f5b"];
      if (ext === "sql") return ["DB", "#d8913b"];
      if (ext === "pdf") return ["P", "#e44747"];
      if (ext === "docx") return ["W", "#2b579a"];
      if (["xlsx", "xls", "csv"].includes(ext)) return ["X", "#217346"];
      if (imageExtensions.has(ext)) return ["▧", "#28a99e"];
      if (videoExtensions.has(ext)) return ["▶", "#a66dd4"];
      if (audioExtensions.has(ext)) return ["♪", "#d66ba0"];
      if (name === "dockerfile") return ["D", "#2496ed"];
      if (name === "makefile") return ["M", "#6d8086"];
      if (["gitignore", "gitconfig"].includes(ext) || name.startsWith(".git")) return ["G", "#f05032"];
      return [ext ? ext.slice(0, 2).toUpperCase() : "·", "#7b8794"];
    }
    function FileIcon({ file, directory = false, expanded = false, size = 18 }) {
      if (directory) return h("svg", { className: "dwu-vscodeIcon", width: size, height: size, viewBox: "0 0 20 20", "aria-hidden": true },
        h("path", { fill: expanded ? "#e6b84d" : "#d6a94b", d: "M1.8 4.2c0-.7.5-1.2 1.2-1.2h5l1.6 1.8H17c.7 0 1.2.5 1.2 1.2v9.6c0 .8-.6 1.4-1.4 1.4H3.2c-.8 0-1.4-.6-1.4-1.4V4.2Z" }),
        expanded && h("path", { fill: "#f1cb68", d: "M2.1 8h15.8l-1.7 8.5H3.5L2.1 8Z" })
      );
      const [label, color] = fileIconSpec(file);
      return h("svg", { className: "dwu-vscodeIcon", width: size, height: size, viewBox: "0 0 20 20", "aria-hidden": true },
        h("path", { fill: color, d: "M4 1.5h8.1L16.5 6v12.5H4V1.5Z" }),
        h("path", { fill: "#fff", opacity: ".3", d: "M12 1.5V6h4.5L12 1.5Z" }),
        h("text", { x: "10.2", y: "14.3", fill: "#fff", textAnchor: "middle", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace", fontSize: label.length > 2 ? "5.1" : "6.5", fontWeight: "800" }, label)
      );
    }
    function basename(value) { return value.split(/[\\/]/).filter(Boolean).pop() ?? value; }
    function apiUrl(op, root, file = "") {
      const params = new URLSearchParams({ op, root, path: file });
      return `${API}?${params}`;
    }
    function assetUrl(root, file) {
      return `${ASSET}?${new URLSearchParams({ root, path: file })}`;
    }
    async function getJson(url, options) {
      const response = await fetch(url, options);
      const value = await response.json();
      if (!response.ok || !value.ok) throw new Error(value.error ?? `HTTP ${response.status}`);
      return value;
    }
    function revealInFinder(root, file) {
      return getJson(apiUrl("reveal", root, file), { method: "POST" });
    }
    function storageKey(root, name) { return `dsh.workspace.${name}:${root}`; }
    function loadJson(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    }
    function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
    const projectMarksKey = "dsh.workspace.projectMarks";
    function automaticProjectMark(title) { return [...String(title || "项目").trim()].slice(0, 2).join("").toUpperCase(); }
    function displayedProjectMark(item, marks) { return marks[item.workspaceId] || automaticProjectMark(item.title); }
    function contextMap(root) {
      const rows = loadJson(storageKey(root, "contexts"), []);
      return new Map(Array.isArray(rows) ? rows.filter((row) => row?.path && row.enabled !== false).map((row) => [row.path, true]) : []);
    }
    function writeContexts(root, map) {
      saveJson(storageKey(root, "contexts"), [...map.keys()].map((path) => ({ path, enabled: true })));
      bus.dispatchEvent(new CustomEvent("contexts", { detail: { root } }));
    }
    async function addContext(root, file) {
      const kind = fileKind(file);
      const currentSnapshot = snapshots.get(root)?.get(file);
      if (!currentSnapshot) {
        if (kind === "text" || kind === "markdown") {
          const value = await getJson(apiUrl("read", root, file));
          updateSnapshot(root, file, { kind, content: value.content, mtimeMs: value.mtimeMs });
        } else {
          updateSnapshot(root, file, { kind });
        }
      }
      const map = contextMap(root);
      if (!map.has(file)) {
        map.set(file, true);
        writeContexts(root, map);
      }
    }
    function setSingleContext(root, file) { writeContexts(root, new Map([[file, true]])); }
    function removeContext(root, file) { const map = contextMap(root); map.delete(file); writeContexts(root, map); }
    function updateSnapshot(root, file, snapshot) {
      let files = snapshots.get(root);
      if (!files) snapshots.set(root, files = new Map());
      files.set(file, snapshot);
    }
    function useBus(name) {
      const [version, setVersion] = React.useState(0);
      React.useEffect(() => {
        const listener = () => setVersion((value) => value + 1);
        bus.addEventListener(name, listener);
        return () => bus.removeEventListener(name, listener);
      }, [name]);
      return version;
    }
    function currentWorkspace(useSessions, useWorkspaces) {
      const sessionState = useSessions((state) => state);
      const workspaces = useWorkspaces((state) => state.items);
      const session = sessionState.current ? sessionState.byId[sessionState.current] : undefined;
      const workspace = workspaces.find((item) => sessionState.current && item.sessionIds.includes(sessionState.current)) ?? workspaces.find((item) => item.path === session?.cwd) ?? workspaces[0];
      return { sessionState, workspaces, session, workspace };
    }

    function fullPath(root, file = "") { return file ? `${root.replace(/\/$/, "")}/${file}` : root; }
    function workspaceFileForHostPath(items, value) {
      if (typeof value !== "string" || !value) return null;
      const full = value.replace(/\\/g, "/").replace(/\/+$/, "");
      const windows = /^[a-z]:\//i.test(full);
      const comparable = windows ? full.toLowerCase() : full;
      const candidates = (Array.isArray(items) ? items : []).map((item) => {
        const root = String(item?.path ?? "").replace(/\\/g, "/").replace(/\/+$/, "");
        return { item, root, comparable: windows ? root.toLowerCase() : root };
      }).filter(({ root }) => root).sort((a, b) => b.root.length - a.root.length);
      const match = candidates.find((entry) => comparable.startsWith(`${entry.comparable}/`));
      return match ? { root: match.item.path, path: full.slice(match.root.length + 1) } : null;
    }
    function copyText(value) {
      if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(value);
      window.prompt("复制路径：", value);
      return Promise.resolve();
    }
    function parentPath(value) { const parts = value.split("/"); parts.pop(); return parts.join("/"); }
    function pathIsWithin(value, prefix) { return value === prefix || value.startsWith(`${prefix}/`); }
    function remapPath(value, source, destination) { return pathIsWithin(value, source) ? destination + value.slice(source.length) : value; }
    function humanFileError(error) {
      const message = error instanceof Error ? error.message : String(error);
      return ({
        "destination-exists": "目标位置已有同名文件，请先重命名或换一个文件夹。",
        "cannot-transfer-into-itself": "不能把文件夹移动或复制到它自己里面。",
        "destination-not-directory": "请选择一个文件夹作为目标位置。",
        "path-outside-workspace": "文件操作不能超出当前项目。",
        "cannot-transfer-workspace-root": "不能移动整个项目根目录。"
      })[message] ?? message;
    }
    async function transferWorkspaceEntry(root, source, destination, mode) {
      const value = await getJson(`${API}?op=transfer`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ root, source, destination, mode }) });
      if (mode === "move" && !value.unchanged) {
        const contexts = contextMap(root);
        if (contexts.size > 0) {
          const next = new Map();
          for (const [file, enabled] of contexts) next.set(remapPath(file, source, value.path), enabled);
          writeContexts(root, next);
        }
        const files = snapshots.get(root);
        if (files) {
          for (const [file, snapshot] of [...files]) {
            if (!pathIsWithin(file, source)) continue;
            files.delete(file); files.set(remapPath(file, source, value.path), snapshot);
          }
        }
        bus.dispatchEvent(new CustomEvent("file-moved", { detail: { root, source, destination: value.path } }));
      }
      bus.dispatchEvent(new CustomEvent("tree-refresh", { detail: { root } }));
      return value;
    }
    async function uploadExternalFiles(root, destination, files) {
      const imported = [];
      for (const file of files) {
        const params = new URLSearchParams({ op: "upload", root, destination, name: file.name, lastModified: String(file.lastModified || 0) });
        imported.push(await getJson(`${API}?${params}`, { method: "POST", headers: { "content-type": file.type || "application/octet-stream" }, body: file }));
      }
      bus.dispatchEvent(new CustomEvent("tree-refresh", { detail: { root } }));
      return imported;
    }
    function ContextMenu({ menu, onClose }) {
      React.useEffect(() => {
        if (!menu) return;
        const close = () => onClose();
        const keydown = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("pointerdown", close);
        window.addEventListener("keydown", keydown);
        window.addEventListener("blur", close);
        window.addEventListener("scroll", close, true);
        return () => {
          window.removeEventListener("pointerdown", close);
          window.removeEventListener("keydown", keydown);
          window.removeEventListener("blur", close);
          window.removeEventListener("scroll", close, true);
        };
      }, [menu, onClose]);
      if (!menu) return null;
      const x = Math.max(6, Math.min(menu.x, window.innerWidth - 226));
      const menuHeight = Math.min(window.innerHeight - 12, menu.items.reduce((height, item) => height + (item.separator ? 9 : 32), 12));
      const y = Math.max(6, Math.min(menu.y, window.innerHeight - menuHeight - 6));
      return h("div", { className: "dwu-contextMenu", role: "menu", style: { left: x, top: y }, onPointerDown: (event) => event.stopPropagation(), onContextMenu: (event) => event.preventDefault() },
        menu.items.map((item, index) => item.separator ? h("div", { key: `separator-${index}`, className: "dwu-menuSeparator" }) : h("button", {
          key: item.label, type: "button", role: "menuitem", className: "dwu-menuItem", "data-danger": item.danger || undefined,
          onClick: () => { onClose(); Promise.resolve().then(item.action).catch((error) => window.alert(error instanceof Error ? error.message : String(error))); }
        }, h("span", { className: "dwu-menuIcon" }, item.icon ?? ""), h("span", null, item.label)))
      );
    }

    function TreeRow({ root, entry, depth, showHidden, active, selected, clipboard, onSelect, onOpen, openPath, onEntryMenu, onEntryDragStart, onEntryDragEnd, onDropEntry, dropTarget, refreshKey }) {
      const [expanded, setExpanded] = React.useState(false);
      const [children, setChildren] = React.useState(null);
      const [error, setError] = React.useState("");
      React.useEffect(() => { if (entry.directory && expanded) setChildren(null); }, [refreshKey, root]);
      React.useEffect(() => {
        if (!expanded || !entry.directory || children !== null) return;
        let live = true;
        getJson(apiUrl("list", root, entry.path)).then((value) => { if (live) setChildren(value.entries); }, (err) => { if (live) setError(err.message); });
        return () => { live = false; };
      }, [expanded, root, entry.path, entry.directory, children]);
      const click = () => {
        onSelect(entry);
        if (entry.directory) setExpanded((value) => !value);
        else onOpen(entry.path, "preview");
      };
      const filtered = (children ?? []).filter((child) => showHidden || (!child.hidden && !forcedHidden.has(child.name)));
      return h(React.Fragment, null,
        h("div", {
          className: "dwu-treeRow", "data-active": !entry.directory && active === entry.path || undefined, "data-selected": selected === entry.path || undefined,
          "data-cut": clipboard?.root === root && clipboard.mode === "cut" && clipboard.path === entry.path || undefined,
          "data-drop": entry.directory && dropTarget === entry.path || undefined,
          draggable: true, tabIndex: 0, onPointerDown: (event) => event.currentTarget.focus(), onClick: click, onDoubleClick: entry.directory ? undefined : () => onOpen(entry.path, "pinned"), onFocus: () => onSelect(entry), title: entry.directory ? `${entry.path}\n单击展开；可拖拽移动；⌘C/⌘X/⌘V 复制、剪切、粘贴` : `${entry.path}\n单击预览，双击固定；可拖拽移动；⌘C/⌘X/⌘V 复制、剪切、粘贴`,
          onDragStart: (event) => onEntryDragStart(event, entry), onDragEnd: onEntryDragEnd,
          onDragEnter: entry.directory ? (event) => { event.preventDefault(); event.stopPropagation(); onDropEntry(event, entry.path, "enter"); } : undefined,
          onDragOver: entry.directory ? (event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes("Files") ? "copy" : "move"; } : undefined,
          onDragLeave: entry.directory ? (event) => { if (!event.currentTarget.contains(event.relatedTarget)) onDropEntry(event, entry.path, "leave"); } : undefined,
          onDrop: entry.directory ? (event) => { event.preventDefault(); event.stopPropagation(); onDropEntry(event, entry.path, "drop"); } : undefined,
          onContextMenu: (event) => { event.preventDefault(); event.stopPropagation(); onEntryMenu(event, entry, { expanded, toggle: () => setExpanded((value) => !value) }); }
        },
          depth > 0 && h("span", { className: "dwu-indentGuides", "aria-hidden": true }, Array.from({ length: depth }, (_, index) => h("span", { key: index, className: "dwu-indentGuide" }))),
          h("span", { className: "dwu-chevron" }, entry.directory ? (expanded ? "▾" : "▸") : ""),
          h("span", { className: "dwu-fileGlyph" }, h(FileIcon, { file: entry.path, directory: entry.directory, expanded })),
          h("span", { className: "dwu-treeName" }, entry.name),
          !entry.directory && h("button", { className: "dwu-iconButton", style: { width: 22, height: 22, marginLeft: "auto" }, title: "用系统默认应用打开", onClick: (event) => { event.stopPropagation(); openPath(`${root}/${entry.path}`); } }, "↗")
        ),
        expanded && entry.directory && (children === null ? h("div", { className: "dwu-treeLoading", style: { paddingLeft: 31 + depth * 18 } }, error || "加载中…") : filtered.map((child) => h(TreeRow, { key: child.path, root, entry: child, depth: depth + 1, showHidden, active, selected, clipboard, onSelect, onOpen, openPath, onEntryMenu, onEntryDragStart, onEntryDragEnd, onDropEntry, dropTarget, refreshKey })))
      );
    }

    function FileTree({ root, showHidden, active, selected, clipboard, onSelect, onOpen, openPath, refreshKey, onEntryMenu, onEntryDragStart, onEntryDragEnd, onDropEntry, dropTarget, busy }) {
      const [entries, setEntries] = React.useState(null);
      const [error, setError] = React.useState("");
      React.useEffect(() => {
        let live = true;
        setEntries(null); setError("");
        getJson(apiUrl("list", root)).then((value) => { if (live) setEntries(value.entries); }, (err) => { if (live) setError(err.message); });
        return () => { live = false; };
      }, [root, refreshKey]);
      if (error) return h("div", { className: "dwu-emptySide" }, `目录读取失败：${error}`);
      if (entries === null) return h("div", { className: "dwu-treeLoading" }, "正在读取项目…");
      const filtered = entries.filter((entry) => showHidden || (!entry.hidden && !forcedHidden.has(entry.name)));
      return h("div", {
        className: "dwu-tree", "data-drop-root": dropTarget === "" || undefined, "data-busy": busy || undefined, tabIndex: 0,
        onDragEnter: (event) => { if (!event.target.closest?.(".dwu-treeRow")) onDropEntry(event, "", "enter"); },
        onDragOver: (event) => { if (event.target.closest?.(".dwu-treeRow")) return; event.preventDefault(); event.dataTransfer.dropEffect = Array.from(event.dataTransfer.types).includes("Files") ? "copy" : "move"; },
        onDragLeave: (event) => { if (event.target === event.currentTarget && !event.currentTarget.contains(event.relatedTarget)) onDropEntry(event, "", "leave"); },
        onDrop: (event) => { if (event.target.closest?.(".dwu-treeRow")) return; event.preventDefault(); onDropEntry(event, "", "drop"); }
      }, filtered.map((entry) => h(TreeRow, { key: entry.path, root, entry, depth: 0, showHidden, active, selected, clipboard, onSelect, onOpen, openPath, onEntryMenu, onEntryDragStart, onEntryDragEnd, onDropEntry, dropTarget, refreshKey })));
    }

    function ProjectMarkDialog({ item, initialValue, onCancel, onSave }) {
      const [value, setValue] = React.useState(initialValue);
      const automatic = automaticProjectMark(item.title);
      const submit = (event) => { event.preventDefault(); onSave(value.trim()); };
      React.useEffect(() => {
        const keydown = (event) => { if (event.key === "Escape") onCancel(); };
        window.addEventListener("keydown", keydown);
        return () => window.removeEventListener("keydown", keydown);
      }, [onCancel]);
      return h("div", { className: "dwu-markOverlay", role: "presentation", onPointerDown: (event) => { if (event.target === event.currentTarget) onCancel(); } },
        h("form", { className: "dwu-markDialog", role: "dialog", "aria-modal": true, "aria-label": "自定义项目标志", onSubmit: submit },
          h("div", { className: "dwu-markTitle" }, "自定义项目标志"),
          h("div", { className: "dwu-markProject", title: item.path }, item.title),
          h("div", { className: "dwu-markEditor" },
            h("div", { className: "dwu-markPreview", "data-long": [...(value || automatic)].length > 2 || undefined }, value || automatic),
            h("input", { className: "dwu-markInput", autoFocus: true, value, placeholder: automatic, "aria-label": "项目标志", onChange: (event) => setValue([...event.target.value].slice(0, 4).join("")) })
          ),
          h("div", { className: "dwu-markHint" }, "输入 1–4 个容易辨认的字；留空并保存可恢复自动标志。"),
          h("div", { className: "dwu-markActions" },
            h("button", { type: "button", className: "dwu-markAction", onClick: () => setValue("") }, "恢复自动"),
            h("button", { type: "button", className: "dwu-markAction", onClick: onCancel }, "取消"),
            h("button", { type: "submit", className: "dwu-markAction", "data-primary": true }, "保存")
          )
        )
      );
    }

    function ProjectActionDialog({ action, onCancel, onRename, onRemove }) {
      const removing = action.type === "remove";
      const [value, setValue] = React.useState(action.item.title);
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState("");
      React.useEffect(() => {
        const keydown = (event) => { if (event.key === "Escape" && !busy) onCancel(); };
        window.addEventListener("keydown", keydown);
        return () => window.removeEventListener("keydown", keydown);
      }, [busy, onCancel]);
      const submit = async (event) => {
        event.preventDefault();
        const title = value.trim();
        if (!removing && !title) { setError("项目名称不能为空。"); return; }
        setBusy(true); setError("");
        try {
          if (removing) await onRemove(action.item);
          else await onRename(action.item, title);
          onCancel();
        } catch (caught) {
          setError(caught instanceof Error ? caught.message : String(caught));
        } finally { setBusy(false); }
      };
      return h("div", { className: "dwu-markOverlay", role: "presentation", onPointerDown: (event) => { if (!busy && event.target === event.currentTarget) onCancel(); } },
        h("form", { className: "dwu-markDialog", role: "dialog", "aria-modal": true, "aria-label": removing ? "从项目栏移除" : "重命名项目", onSubmit: submit },
          h("div", { className: "dwu-markTitle" }, removing ? "从项目栏移除" : "重命名项目"),
          h("div", { className: "dwu-markProject" }, action.item.title),
          removing ? h(React.Fragment, null,
            h("div", { className: "dwu-projectActionText" }, "项目会从左侧列表移除，但项目目录、文件和历史会话都不会被删除。"),
            h("div", { className: "dwu-projectActionPath" }, action.item.path)
          ) : h("div", { className: "dwu-markEditor", style: { marginBottom: 4 } },
            h("input", { className: "dwu-markInput", autoFocus: true, value, maxLength: 80, "aria-label": "新的项目名称", onChange: (event) => setValue(event.target.value), onFocus: (event) => event.currentTarget.select() })
          ),
          error && h("div", { className: "dwu-projectActionError", role: "alert" }, error),
          h("div", { className: "dwu-markActions" },
            h("button", { type: "button", className: "dwu-markAction", disabled: busy, onClick: onCancel }, "取消"),
            h("button", { type: "submit", className: "dwu-markAction", "data-primary": !removing || undefined, "data-danger": removing || undefined, disabled: busy }, busy ? "处理中…" : removing ? "确认移除" : "保存名称")
          )
        )
      );
    }

    function projectCreateError(error) {
      const message = error instanceof Error ? error.message : String(error);
      if (/exist|duplicate|already/i.test(message)) return "这个位置已经有同名文件夹，请换一个项目名。";
      if (/permission|denied|not permitted/i.test(message)) return "没有权限在这个位置创建项目，请换一个保存位置。";
      return message;
    }

    function NewProjectDialog({ onCancel, pickDirectory, createDirectory, createWorkspace, onPick }) {
      const [name, setName] = React.useState("");
      const [location, setLocation] = React.useState("");
      const [busy, setBusy] = React.useState(false);
      const [choosing, setChoosing] = React.useState(false);
      const [error, setError] = React.useState("");
      const chooseLocation = async () => {
        if (busy || choosing) return;
        setChoosing(true); setError("");
        try {
          const path = await pickDirectory();
          if (path) setLocation(path);
        } catch (caught) { setError(projectCreateError(caught)); }
        finally { setChoosing(false); }
      };
      const submit = async (event) => {
        event.preventDefault();
        const projectName = name.trim();
        if (!projectName || projectName === "." || projectName === ".." || /[/\\]/.test(projectName)) { setError("请输入一个有效的项目名称，名称中不能包含斜杠。"); return; }
        if (!location) { setError("请先选择新项目的保存位置。"); return; }
        setBusy(true); setError("");
        try {
          const path = await createDirectory(location, projectName);
          const workspace = await createWorkspace({ path });
          onCancel();
          onPick(workspace.workspaceId);
        } catch (caught) { setError(projectCreateError(caught)); }
        finally { setBusy(false); }
      };
      React.useEffect(() => {
        const keydown = (event) => { if (event.key === "Escape" && !busy && !choosing) onCancel(); };
        window.addEventListener("keydown", keydown);
        return () => window.removeEventListener("keydown", keydown);
      }, [busy, choosing, onCancel]);
      return h("div", { className: "dwu-root dwu-markOverlay", role: "presentation", onPointerDown: (event) => { if (!busy && !choosing && event.target === event.currentTarget) onCancel(); } },
        h("form", { className: "dwu-markDialog dwu-newProjectDialog", role: "dialog", "aria-modal": true, "aria-label": "创建新项目", onSubmit: submit },
          h("div", { className: "dwu-markTitle" }, "创建新项目"),
          h("div", { className: "dwu-markProject" }, "新建一个文件夹，并立即作为 AI 工作台项目打开。"),
          h("div", { className: "dwu-newProjectFields" },
            h("label", { className: "dwu-newProjectLabel" }, "项目名称",
              h("input", { className: "dwu-newProjectInput", autoFocus: true, value: name, maxLength: 80, placeholder: "例如：产品官网", disabled: busy, onChange: (event) => { setName(event.target.value); setError(""); } })
            ),
            h("div", { className: "dwu-newProjectLabel" }, "保存位置",
              h("div", { className: "dwu-newProjectLocation" },
                h("div", { className: "dwu-newProjectLocationPath", title: location || "尚未选择" }, location || "尚未选择保存位置"),
                h("button", { type: "button", className: "dwu-newProjectLocationButton", disabled: busy || choosing, onClick: chooseLocation }, choosing ? "选择中…" : location ? "更改" : "选择位置")
              )
            ),
            location && name.trim() && h("div", { className: "dwu-newProjectHint", title: fullPath(location, name.trim()) }, `将创建：${fullPath(location, name.trim())}`)
          ),
          error && h("div", { className: "dwu-projectActionError", role: "alert" }, error),
          h("div", { className: "dwu-markActions" },
            h("button", { type: "button", className: "dwu-markAction", disabled: busy || choosing, onClick: onCancel }, "取消"),
            h("button", { type: "submit", className: "dwu-markAction", "data-primary": true, disabled: busy || choosing }, busy ? "正在创建…" : "创建并打开")
          )
        )
      );
    }

    function ProjectPicker({ open, anchorRef, selectedId, onPick, onClose, useWorkspaces, pickDirectory, createDirectory, createWorkspace }) {
      const snapshot = useWorkspaces((state) => state);
      const workspaces = snapshot.items ?? [];
      const [position, setPosition] = React.useState({ left: 8, top: 8 });
      const [busy, setBusy] = React.useState(false);
      const [error, setError] = React.useState("");
      const [createOpen, setCreateOpen] = React.useState(false);
      const rootRef = React.useRef(null);
      const place = React.useCallback(() => {
        const rect = anchorRef?.current?.getBoundingClientRect();
        if (!rect) return;
        const width = 300;
        const estimatedHeight = Math.min(430, 100 + workspaces.length * 43);
        const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
        const below = rect.bottom + 7;
        const top = below + estimatedHeight <= window.innerHeight - 8 ? below : Math.max(8, rect.top - estimatedHeight - 7);
        setPosition({ left, top });
      }, [anchorRef, workspaces.length]);
      React.useLayoutEffect(() => {
        if (!open) return;
        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
      }, [open, place]);
      React.useEffect(() => {
        if (!open) return;
        const pointer = (event) => {
          if (!rootRef.current?.contains(event.target) && !anchorRef?.current?.contains(event.target)) onClose();
        };
        const keydown = (event) => { if (event.key === "Escape") onClose(); };
        window.addEventListener("pointerdown", pointer);
        window.addEventListener("keydown", keydown);
        return () => { window.removeEventListener("pointerdown", pointer); window.removeEventListener("keydown", keydown); };
      }, [open, anchorRef, onClose]);
      React.useEffect(() => { if (open) setError(""); }, [open]);
      const chooseExisting = async () => {
        if (busy) return;
        setBusy(true); setError("");
        try {
          const path = await pickDirectory();
          if (!path) return;
          const workspace = await createWorkspace({ path });
          onClose();
          onPick(workspace.workspaceId);
        } catch (caught) { setError(projectCreateError(caught)); }
        finally { setBusy(false); }
      };
      if (!open && !createOpen) return null;
      return ReactDOM.createPortal(h(React.Fragment, null,
        open && h("div", { ref: rootRef, className: "dwu-root dwu-projectPicker", role: "dialog", "aria-label": "选择项目", style: position },
          h("div", { className: "dwu-projectPickerHead" }, "选择项目"),
          h("div", { className: "dwu-projectPickerList" }, workspaces.length === 0 ? h("div", { className: "dwu-projectPickerEmpty" }, "还没有项目") : workspaces.map((workspace) => h("button", {
            key: workspace.workspaceId, type: "button", className: "dwu-projectPickerRow", "data-selected": workspace.workspaceId === selectedId || undefined, disabled: busy,
            title: workspace.path, onClick: () => { onClose(); if (workspace.workspaceId !== selectedId) onPick(workspace.workspaceId); }
          },
            h("span", { className: "dwu-projectPickerFolder" }, h(FileIcon, { file: workspace.path, directory: true, size: 18 })),
            h("span", { className: "dwu-projectPickerMeta" }, h("span", { className: "dwu-projectPickerName" }, workspace.title), h("span", { className: "dwu-projectPickerPath" }, workspace.path)),
            h("span", { className: "dwu-projectPickerCheck", "aria-hidden": true }, workspace.workspaceId === selectedId ? "✓" : "")
          ))),
          error && h("div", { className: "dwu-projectPickerError", role: "alert" }, error),
          h("div", { className: "dwu-projectPickerActions" },
            h("button", { type: "button", className: "dwu-projectPickerAction", disabled: busy, onClick: () => { onClose(); setCreateOpen(true); } }, h("span", { className: "dwu-projectPickerActionIcon" }, "+"), h("span", null, "创建新项目")),
            h("button", { type: "button", className: "dwu-projectPickerAction", disabled: busy, onClick: chooseExisting }, h("span", { className: "dwu-projectPickerActionIcon" }, "↗"), h("span", null, busy ? "正在打开…" : "打开已有文件夹…"))
          )
        ),
        createOpen && h(NewProjectDialog, { onCancel: () => setCreateOpen(false), pickDirectory, createDirectory, createWorkspace, onPick })
      ), document.body);
    }

    function SidebarWorkspace({ wide, useSessions, useWorkspaces, pickProject, openWorkspace, openPath, startProjectSession, renameProject, deleteProject }) {
      const { workspaces, workspace } = currentWorkspace(useSessions, useWorkspaces);
      const [showHidden, setShowHidden] = React.useState(() => loadJson("dsh.workspace.showHidden", false));
      const [projectMarks, setProjectMarks] = React.useState(() => loadJson(projectMarksKey, {}));
      const [refreshKey, setRefreshKey] = React.useState(0);
      const [active, setActive] = React.useState("");
      const [selectedEntry, setSelectedEntry] = React.useState(null);
      const [clipboard, setClipboard] = React.useState(null);
      const [dropTarget, setDropTarget] = React.useState(null);
      const [busy, setBusy] = React.useState(false);
      const [notice, setNotice] = React.useState("");
      const [menu, setMenu] = React.useState(null);
      const [markEditor, setMarkEditor] = React.useState(null);
      const [projectAction, setProjectAction] = React.useState(null);
      const sidebarRef = React.useRef(null);
      const draggingEntry = React.useRef(null);
      const noticeTimer = React.useRef(null);
      const closeMenu = React.useCallback(() => setMenu(null), []);
      const closeMarkEditor = React.useCallback(() => setMarkEditor(null), []);
      const closeProjectAction = React.useCallback(() => setProjectAction(null), []);
      const showNotice = React.useCallback((message, duration = 2600) => {
        setNotice(message);
        if (noticeTimer.current) clearTimeout(noticeTimer.current);
        noticeTimer.current = setTimeout(() => setNotice(""), duration);
      }, []);
      React.useEffect(() => () => { if (noticeTimer.current) clearTimeout(noticeTimer.current); }, []);
      React.useEffect(() => { setSelectedEntry(null); setDropTarget(null); }, [workspace?.path]);
      React.useEffect(() => {
        const listener = (event) => { if (event.detail.root === workspace?.path) setActive(event.detail.path); };
        bus.addEventListener("open-file", listener);
        return () => bus.removeEventListener("open-file", listener);
      }, [workspace?.path]);
      React.useEffect(() => {
        const refresh = (event) => { if (event.detail.root === workspace?.path) setRefreshKey((value) => value + 1); };
        const moved = (event) => {
          if (event.detail.root !== workspace?.path) return;
          setActive((value) => remapPath(value, event.detail.source, event.detail.destination));
          setSelectedEntry((value) => value && pathIsWithin(value.path, event.detail.source) ? { ...value, path: remapPath(value.path, event.detail.source, event.detail.destination) } : value);
        };
        bus.addEventListener("tree-refresh", refresh); bus.addEventListener("file-moved", moved);
        return () => { bus.removeEventListener("tree-refresh", refresh); bus.removeEventListener("file-moved", moved); };
      }, [workspace?.path]);
      const openFile = (file, mode = "preview") => {
        setActive(file);
        bus.dispatchEvent(new CustomEvent("open-file", { detail: { root: workspace.path, path: file, mode, source: "tree" } }));
      };
      const setClipboardEntry = React.useCallback((entry, mode) => {
        if (!workspace || !entry) return;
        setClipboard({ root: workspace.path, path: entry.path, directory: entry.directory, mode });
        showNotice(`${mode === "cut" ? "已剪切" : "已复制"} ${entry.name} · 在目标文件夹按 ⌘V`);
      }, [workspace?.path, showNotice]);
      const runTransfer = React.useCallback(async (source, destination, mode) => {
        if (!workspace || busy) return;
        setBusy(true); setDropTarget(null);
        try {
          const result = await transferWorkspaceEntry(workspace.path, source, destination, mode);
          if (mode === "move" && !result.unchanged) setClipboard((value) => value?.mode === "cut" && value.path === source ? null : value);
          showNotice(result.unchanged ? "文件已经在这个位置。" : `${mode === "move" ? "已移动到" : "已复制到"} ${destination || "项目根目录"}`);
        } catch (error) {
          showNotice(humanFileError(error), 4200);
        } finally { setBusy(false); }
      }, [workspace?.path, busy, showNotice]);
      const pasteIntoSelection = React.useCallback(() => {
        if (!workspace || !clipboard) { showNotice("还没有复制或剪切文件。", 2200); return; }
        if (clipboard.root !== workspace.path) { showNotice("请先回到复制文件所在的项目完成粘贴。", 3200); return; }
        const destination = selectedEntry?.directory ? selectedEntry.path : selectedEntry ? parentPath(selectedEntry.path) : "";
        runTransfer(clipboard.path, destination, clipboard.mode === "cut" ? "move" : "copy");
      }, [workspace?.path, clipboard, selectedEntry, runTransfer, showNotice]);
      React.useEffect(() => {
        const keydown = (event) => {
          if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
          const target = event.target;
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target?.isContentEditable || !sidebarRef.current?.contains(document.activeElement)) return;
          const key = event.key.toLowerCase();
          if (key === "c" && selectedEntry) { event.preventDefault(); setClipboardEntry(selectedEntry, "copy"); }
          else if (key === "x" && selectedEntry) { event.preventDefault(); setClipboardEntry(selectedEntry, "cut"); }
          else if (key === "v") { event.preventDefault(); pasteIntoSelection(); }
        };
        window.addEventListener("keydown", keydown);
        return () => window.removeEventListener("keydown", keydown);
      }, [selectedEntry, setClipboardEntry, pasteIntoSelection]);
      const startEntryDrag = (event, entry) => {
        const payload = { root: workspace.path, path: entry.path, directory: entry.directory };
        draggingEntry.current = payload; setSelectedEntry(entry);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-dsh-workspace-entry", JSON.stringify(payload));
        event.dataTransfer.setData("text/plain", fullPath(workspace.path, entry.path));
      };
      const endEntryDrag = () => { draggingEntry.current = null; setDropTarget(null); };
      const dropEntry = (event, destination, phase) => {
        if (phase === "enter") { setDropTarget(destination); return; }
        if (phase === "leave") { setDropTarget((value) => value === destination ? null : value); return; }
        setDropTarget(null);
        if (busy) return;
        const transfer = event.dataTransfer;
        const externalFiles = [...(transfer.files ?? [])];
        if (externalFiles.length > 0) {
          const containsDirectory = [...(transfer.items ?? [])].some((item) => item.kind === "file" && item.webkitGetAsEntry?.()?.isDirectory);
          if (containsDirectory) { showNotice("当前支持拖入外部文件；外部文件夹请先在 Finder 中打开后选择文件。", 4200); return; }
          setBusy(true);
          showNotice(`正在导入 ${externalFiles.length} 个文件…`, 120000);
          uploadExternalFiles(workspace.path, destination, externalFiles).then((rows) => showNotice(`已导入 ${rows.length} 个文件到 ${destination || "项目根目录"}`), (error) => showNotice(humanFileError(error), 5000)).finally(() => setBusy(false));
          return;
        }
        let payload = draggingEntry.current;
        try { payload = JSON.parse(transfer.getData("application/x-dsh-workspace-entry")) || payload; } catch {}
        if (!payload || payload.root !== workspace.path) { showNotice("只能在同一个项目内拖拽移动文件。", 3200); return; }
        runTransfer(payload.path, destination, "move");
      };
      const projectMenu = (event, item) => {
        event.preventDefault(); event.stopPropagation();
        setMenu({ x: event.clientX, y: event.clientY, items: [
          { label: "新建任务", icon: "+", action: () => startProjectSession(item.workspaceId) },
          { label: "重命名项目", icon: "✎", action: () => setProjectAction({ type: "rename", item }) },
          { label: "自定义项目标志", icon: "Aa", action: () => setMarkEditor(item) },
          { separator: true },
          { label: "从项目栏移除", icon: "−", danger: true, action: () => setProjectAction({ type: "remove", item }) }
        ] });
      };
      const entryMenu = (event, entry, directoryState) => {
        setSelectedEntry(entry);
        const absolute = fullPath(workspace.path, entry.path);
        const items = entry.directory ? [
          { label: directoryState.expanded ? "收起文件夹" : "展开文件夹", icon: directoryState.expanded ? "▾" : "▸", action: directoryState.toggle },
          { separator: true },
          { label: "复制", icon: "⌘C", action: () => setClipboardEntry(entry, "copy") },
          { label: "剪切", icon: "⌘X", action: () => setClipboardEntry(entry, "cut") },
          ...(clipboard?.root === workspace.path ? [{ label: "粘贴到此文件夹", icon: "⌘V", action: () => runTransfer(clipboard.path, entry.path, clipboard.mode === "cut" ? "move" : "copy") }] : []),
          { separator: true },
          { label: "在 Finder 中显示", icon: "⌖", action: () => revealInFinder(workspace.path, entry.path) },
          { separator: true },
          { label: "复制完整路径", icon: "⌘", action: () => copyText(absolute) }
        ] : [
          { label: "在中间固定打开", icon: "↗", action: () => openFile(entry.path, "pinned") },
          { label: "添加为 AI 参考文件", icon: "+", action: () => addContext(workspace.path, entry.path) },
          { separator: true },
          { label: "复制", icon: "⌘C", action: () => setClipboardEntry(entry, "copy") },
          { label: "剪切", icon: "⌘X", action: () => setClipboardEntry(entry, "cut") },
          ...(clipboard?.root === workspace.path ? [{ label: "粘贴到所在文件夹", icon: "⌘V", action: () => runTransfer(clipboard.path, parentPath(entry.path), clipboard.mode === "cut" ? "move" : "copy") }] : []),
          { separator: true },
          { label: "用系统默认应用打开", icon: "□", action: () => openPath(absolute) },
          { label: "在 Finder 中显示", icon: "⌖", action: () => revealInFinder(workspace.path, entry.path) },
          { separator: true },
          { label: "复制完整路径", icon: "⌘", action: () => copyText(absolute) }
        ];
        setMenu({ x: event.clientX, y: event.clientY, items });
      };
      return h("div", { className: "dwu-root dwu-sidebar", "data-collapsed": !wide || undefined, ref: sidebarRef },
        h("div", { className: "dwu-projects" },
          workspaces.map((item) => { const mark = displayedProjectMark(item, projectMarks); return h("button", { key: item.workspaceId, className: "dwu-projectButton", "data-active": item.workspaceId === workspace?.workspaceId || undefined, "data-long": [...mark].length > 2 || undefined, title: `${item.title}\n项目标志：${mark}\n右键管理项目\n${item.path}`, "aria-label": `${item.title}，项目标志 ${mark}`, onClick: () => openWorkspace(item), onContextMenu: (event) => projectMenu(event, item) }, mark); }),
          h("button", { className: "dwu-addProject", title: "打开项目文件夹", onClick: pickProject }, "+")
        ),
        h("div", { className: "dwu-treePanel" },
          workspace ? h(React.Fragment, null,
            h("div", { className: "dwu-treeHead" },
              h("div", { className: "dwu-treeTitle", title: workspace.path }, workspace.title),
              h("button", { className: "dwu-iconButton", title: showHidden ? "隐藏系统目录" : "显示隐藏目录", onClick: () => { const next = !showHidden; setShowHidden(next); saveJson("dsh.workspace.showHidden", next); } }, showHidden ? "◉" : "○"),
              h("button", { className: "dwu-iconButton", title: "刷新文件树", onClick: () => setRefreshKey((value) => value + 1) }, "↻")
            ),
            (dropTarget !== null || busy) && h("div", { className: "dwu-treeDropHint" }, busy ? "正在处理文件…" : `释放后移动或导入到 ${dropTarget || "项目根目录"}`),
            h(FileTree, { root: workspace.path, showHidden, active, selected: selectedEntry?.path, clipboard, onSelect: setSelectedEntry, onOpen: openFile, openPath, refreshKey, onEntryMenu: entryMenu, onEntryDragStart: startEntryDrag, onEntryDragEnd: endEntryDrag, onDropEntry: dropEntry, dropTarget, busy }),
            notice && h("div", { className: "dwu-fileNotice", role: "status" }, notice)
          ) : h("div", { className: "dwu-emptySide" }, "点击左侧 ＋ 选择一个项目文件夹。")
        ),
        h(ContextMenu, { menu, onClose: closeMenu }),
        markEditor && h(ProjectMarkDialog, {
          item: markEditor, initialValue: projectMarks[markEditor.workspaceId] || "", onCancel: closeMarkEditor,
          onSave: (next) => {
            setProjectMarks((previous) => { const updated = { ...previous }; if (next) updated[markEditor.workspaceId] = next; else delete updated[markEditor.workspaceId]; saveJson(projectMarksKey, updated); return updated; });
            setMarkEditor(null);
          }
        }),
        projectAction && h(ProjectActionDialog, {
          action: projectAction, onCancel: closeProjectAction,
          onRename: async (item, title) => { if (title !== item.title) await renameProject(item.workspaceId, title); showNotice(`项目已重命名为 ${title}`); },
          onRemove: async (item) => {
            await deleteProject(item.workspaceId);
            setProjectMarks((previous) => { const updated = { ...previous }; delete updated[item.workspaceId]; saveJson(projectMarksKey, updated); return updated; });
            showNotice(`已从项目栏移除 ${item.title}`);
          }
        })
      );
    }

    function escapeHtml(value) {
      return value.replace(/[&<>\"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" })[char]);
    }
    function highlightedCode(source) {
      const keyword = /^(?:const|let|var|function|class|return|if|else|for|while|switch|case|break|continue|async|await|import|export|from|default|new|try|catch|finally|throw|extends|implements|interface|type|public|private|protected|static|true|false|null|undefined|def|lambda|yield|with|as|in|is|not|and|or|pass|raise|package|func|struct|enum|protocol|guard|defer)$/;
      const pattern = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\n]*|#[^\n]*|\b(?:const|let|var|function|class|return|if|else|for|while|switch|case|break|continue|async|await|import|export|from|default|new|try|catch|finally|throw|extends|implements|interface|type|public|private|protected|static|true|false|null|undefined|def|lambda|yield|with|as|in|is|not|and|or|pass|raise|package|func|struct|enum|protocol|guard|defer)\b|\b\d+(?:\.\d+)?\b)/g;
      let out = "", cursor = 0;
      for (const match of source.matchAll(pattern)) {
        out += escapeHtml(source.slice(cursor, match.index));
        const token = match[0];
        const cls = token.startsWith("//") || token.startsWith("/*") || token.startsWith("#") ? "com" : token.startsWith("\"") || token.startsWith("'") || token.startsWith("`") ? "str" : keyword.test(token) ? "kw" : "num";
        out += `<span class="${cls}">${escapeHtml(token)}</span>`;
        cursor = match.index + token.length;
      }
      return out + escapeHtml(source.slice(cursor)) + "\n";
    }
    function markdownHtml(source) {
      const blocks = [];
      let value = escapeHtml(source).replace(/```([^\n]*)\n([\s\S]*?)```/g, (_, lang, code) => {
        const token = `@@DWU_BLOCK_${blocks.length}@@`;
        blocks.push(`<pre data-language="${lang.trim()}"><code>${code.replace(/\n$/, "")}</code></pre>`);
        return token;
      });
      value = value
        .replace(/^######\s+(.+)$/gm, "<h6>$1</h6>").replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>").replace(/^####\s+(.+)$/gm, "<h4>$1</h4>")
        .replace(/^###\s+(.+)$/gm, "<h3>$1</h3>").replace(/^##\s+(.+)$/gm, "<h2>$1</h2>").replace(/^#\s+(.+)$/gm, "<h1>$1</h1>")
        .replace(/^&gt;\s?(.+)$/gm, "<blockquote>$1</blockquote>")
        .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
        .split(/\n{2,}/).map((part) => /^<(h\d|pre|blockquote|li)/.test(part) || /^@@DWU_BLOCK_/.test(part) ? part : `<p>${part.replace(/\n/g, "<br>")}</p>`).join("\n");
      blocks.forEach((block, index) => { value = value.replace(`@@DWU_BLOCK_${index}@@`, block); });
      return value.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (list) => `<ul>${list}</ul>`);
    }

    function OfficePreview({ root, file }) {
      const [data, setData] = React.useState(null);
      const [error, setError] = React.useState("");
      const [sheet, setSheet] = React.useState(0);
      React.useEffect(() => {
        let live = true; setData(null); setError(""); setSheet(0);
        getJson(apiUrl("preview", root, file)).then((value) => { if (live) setData(value); }, (err) => { if (live) setError(err.message); });
        return () => { live = false; };
      }, [root, file]);
      if (error) return h("div", { className: "dwu-error" }, `预览失败：${error}`);
      if (!data) return h("div", { className: "dwu-loading" }, "正在生成预览…");
      const pageCss = `<style>body{font:14px/1.6 -apple-system,BlinkMacSystemFont,sans-serif;color:#1f2328;padding:28px;margin:0}img{max-width:100%}table{border-collapse:collapse;min-width:100%}td,th{border:1px solid #d0d7de;padding:5px 8px;white-space:nowrap}tr:nth-child(even){background:#f6f8fa}h1,h2,h3{line-height:1.25}</style>`;
      if (data.kind === "workbook") {
        const current = data.sheets[sheet] ?? data.sheets[0];
        return h("div", { className: "dwu-office" },
          h("div", { className: "dwu-sheetTabs" }, data.sheets.map((item, index) => h("button", { key: item.name, className: "dwu-sheetTab", "data-active": index === sheet || undefined, onClick: () => setSheet(index) }, item.name))),
          h("iframe", { className: "dwu-frame", sandbox: "allow-same-origin", srcDoc: `${pageCss}${current?.html ?? ""}` })
        );
      }
      return h("iframe", { className: "dwu-frame", sandbox: "allow-same-origin", srcDoc: `${pageCss}${data.html}` });
    }

    function FilePane({ root, file, onDirty }) {
      const kind = fileKind(file);
      const [content, setContent] = React.useState("");
      const [mtimeMs, setMtimeMs] = React.useState(0);
      const [dirty, setDirty] = React.useState(false);
      const [status, setStatus] = React.useState("");
      const [error, setError] = React.useState("");
      const [preview, setPreview] = React.useState(false);
      const [flash, setFlash] = React.useState(false);
      const linesRef = React.useRef(null);
      const highlightRef = React.useRef(null);
      const isText = kind === "text" || kind === "markdown";
      const syntaxHighlight = kind === "text" && !["txt", "log", "csv"].includes(extOf(file));
      const load = React.useCallback((external = false) => {
        if (!isText) return;
        setError("");
        getJson(apiUrl("read", root, file)).then((value) => {
          setContent(value.content); setMtimeMs(value.mtimeMs); setDirty(false); onDirty(false); setStatus(external ? "已同步 AI/磁盘改动" : "");
          updateSnapshot(root, file, { kind, content: value.content, mtimeMs: value.mtimeMs });
          if (external) { setFlash(true); setTimeout(() => setFlash(false), 950); }
        }, (err) => setError(err.message));
      }, [root, file, isText, kind, onDirty]);
      React.useEffect(() => { setContent(""); setMtimeMs(0); setDirty(false); setPreview(false); setStatus(""); load(false); }, [load]);
      React.useEffect(() => {
        if (!isText) { updateSnapshot(root, file, { kind }); return; }
        const timer = setInterval(() => {
          if (dirty) return;
          getJson(apiUrl("stat", root, file)).then((value) => { if (mtimeMs && Math.abs(value.mtimeMs - mtimeMs) > 1) load(true); }).catch(() => {});
        }, 2500);
        return () => clearInterval(timer);
      }, [root, file, isText, dirty, mtimeMs, load, kind]);
      const save = React.useCallback(async () => {
        if (!isText || !dirty) return;
        setStatus("保存中…");
        try {
          const value = await getJson(`${API}?op=write`, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ root, path: file, content, expectedMtimeMs: mtimeMs }) });
          setMtimeMs(value.mtimeMs); setDirty(false); onDirty(false); setStatus("已保存"); updateSnapshot(root, file, { kind, content, mtimeMs: value.mtimeMs });
        } catch (err) { setStatus(err.message === "file-changed-on-disk" ? "磁盘文件已变化，请先重新载入" : `保存失败：${err.message}`); }
      }, [isText, dirty, root, file, content, mtimeMs, onDirty, kind]);
      React.useEffect(() => {
        const onKey = (event) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save(); } };
        window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey);
      }, [save]);
      const toolbar = h("div", { className: "dwu-fileToolbar" },
        h("div", { className: "dwu-fileMeta", title: `${root}/${file}` }, file),
        status && h("span", { className: "dwu-status", "data-error": /失败|变化/.test(status) || undefined }, status),
        kind === "markdown" && h("button", { className: "dwu-toolButton", onClick: () => setPreview((value) => !value) }, preview ? "源码" : "预览"),
        isText && h("button", { className: "dwu-toolButton", onClick: () => load(false) }, "重新载入"),
        isText && h("button", { className: "dwu-toolButton", disabled: !dirty, onClick: save }, "保存 ⌘S")
      );
      if (error) return h("div", { className: "dwu-filePane" }, toolbar, h("div", { className: "dwu-error" }, `读取失败：${error}`));
      if (kind === "markdown" && preview) return h("div", { className: "dwu-filePane" }, toolbar, h("article", { className: "dwu-preview", dangerouslySetInnerHTML: { __html: markdownHtml(content) } }));
      if (isText) {
        const lineNumbers = Array.from({ length: Math.max(1, content.split("\n").length) }, (_, index) => index + 1).join("\n");
        return h("div", { className: "dwu-filePane" }, toolbar, h("div", { className: "dwu-editorWrap" },
          h("pre", { ref: linesRef, className: "dwu-lines" }, lineNumbers),
          h("div", { className: "dwu-codeArea" },
            syntaxHighlight && h("pre", { ref: highlightRef, className: "dwu-highlight", "aria-hidden": true, dangerouslySetInnerHTML: { __html: highlightedCode(content) } }),
            h("textarea", { className: "dwu-editor", "data-highlight": syntaxHighlight || undefined, "data-flash": flash || undefined, spellCheck: false, value: content, onScroll: (event) => { if (linesRef.current) linesRef.current.scrollTop = event.currentTarget.scrollTop; if (highlightRef.current) { highlightRef.current.scrollTop = event.currentTarget.scrollTop; highlightRef.current.scrollLeft = event.currentTarget.scrollLeft; } }, onChange: (event) => { const next = event.target.value; setContent(next); setDirty(true); onDirty(true); setStatus(""); updateSnapshot(root, file, { kind, content: next, mtimeMs }); } })
          )
        ));
      }
      if (kind === "pdf") return h("div", { className: "dwu-filePane" }, toolbar, h("iframe", { className: "dwu-frame", src: assetUrl(root, file), title: file }));
      if (kind === "video") return h("div", { className: "dwu-filePane" }, toolbar, h("div", { className: "dwu-media" }, h("video", { src: assetUrl(root, file), controls: true, preload: "metadata" }, "当前视频编码无法在浏览器中播放。")));
      if (kind === "audio") return h("div", { className: "dwu-filePane" }, toolbar, h("div", { className: "dwu-media" }, h("audio", { src: assetUrl(root, file), controls: true, preload: "metadata" })));
      if (kind === "image") return h("div", { className: "dwu-filePane" }, toolbar, h("div", { className: "dwu-media" }, h("img", { src: assetUrl(root, file), alt: file })));
      if (kind === "office") return h("div", { className: "dwu-filePane" }, toolbar, h(OfficePreview, { root, file }));
      return h("div", { className: "dwu-filePane" }, toolbar, h("div", { className: "dwu-welcome" }, h("div", { className: "dwu-welcomeCard" }, h("div", { className: "dwu-welcomeIcon" }, "◇"), h("div", { className: "dwu-welcomeTitle" }, "暂不支持内嵌预览"), h("div", { className: "dwu-welcomeText" }, "可以在左侧文件树点击 ↗，使用系统默认应用打开。"))));
    }

    function TerminalPanel({ root, onClose }) {
      const [command, setCommand] = React.useState("");
      const [cwd, setCwd] = React.useState(root);
      const [entries, setEntries] = React.useState([]);
      const [running, setRunning] = React.useState(false);
      const outputRef = React.useRef(null);
      const inputRef = React.useRef(null);
      React.useEffect(() => { inputRef.current?.focus(); }, []);
      React.useEffect(() => {
        const node = outputRef.current;
        if (node) node.scrollTop = node.scrollHeight;
      }, [entries]);
      const run = async (event) => {
        event.preventDefault();
        const value = command.trim();
        if (!value || running) return;
        const id = `${Date.now()}-${Math.random()}`;
        setCommand("");
        setRunning(true);
        setEntries((previous) => [...previous, { id, command: value, output: "", code: null }]);
        try {
          const result = await getJson(`${API}?op=terminal`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ root, cwd, command: value })
          });
          if (typeof result.cwd === "string" && result.cwd) setCwd(result.cwd);
          setEntries((previous) => previous.map((entry) => entry.id === id ? { ...entry, output: result.output, code: result.code } : entry));
        } catch (error) {
          setEntries((previous) => previous.map((entry) => entry.id === id ? { ...entry, output: `终端错误：${error.message}`, code: 1 } : entry));
        } finally {
          setRunning(false);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
      };
      return h("section", { className: "dwu-terminal", "aria-label": "项目终端" },
        h("div", { className: "dwu-terminalHead" },
          h("span", { className: "dwu-terminalCwd", title: cwd }, cwd),
          h("button", { type: "button", className: "dwu-terminalAction", disabled: entries.length === 0, onClick: () => setEntries([]) }, "清空"),
          h("button", { type: "button", className: "dwu-terminalAction", "aria-label": "关闭终端", onClick: onClose }, "×")
        ),
        h("div", { ref: outputRef, className: "dwu-terminalOutput", role: "log", "aria-live": "polite" },
          entries.length === 0 && h("div", { className: "dwu-terminalEntry" }, h("span", { className: "dwu-terminalPrompt" }, "❯ "), "在当前项目目录运行命令"),
          entries.map((entry) => h("div", { key: entry.id, className: "dwu-terminalEntry" },
            h("div", { className: "dwu-terminalCommand" }, h("span", { className: "dwu-terminalPrompt" }, "❯ "), entry.command),
            entry.output && h("div", { className: "dwu-terminalResult", "data-error": entry.code !== null && entry.code !== 0 || undefined }, entry.output),
            entry.code !== null && entry.code !== 0 && h("div", { className: "dwu-terminalResult", "data-error": true }, `[退出代码 ${entry.code}]`)
          ))
        ),
        h("form", { className: "dwu-terminalForm", onSubmit: run },
          h("span", { className: "dwu-terminalPrompt" }, "❯"),
          h("input", { ref: inputRef, className: "dwu-terminalInput", value: command, disabled: running, autoComplete: "off", spellCheck: false, placeholder: running ? "命令运行中…" : "输入命令并按回车", onChange: (event) => setCommand(event.target.value) }),
          running && h("span", { className: "dwu-terminalRunning" }, "运行中")
        )
      );
    }

    function WorkspaceSurface({ useSessions, useWorkspaces }) {
      const { workspace } = currentWorkspace(useSessions, useWorkspaces);
      const root = workspace?.path;
      const [tabs, setTabs] = React.useState([]);
      const [active, setActive] = React.useState("");
      const [dirty, setDirty] = React.useState({});
      const [previewTab, setPreviewTabState] = React.useState("");
      const [terminalOpen, setTerminalOpen] = React.useState(false);
      const tabsRef = React.useRef([]);
      const previewTabRef = React.useRef("");
      const dirtyRef = React.useRef({});
      dirtyRef.current = dirty;
      const setPreviewTab = React.useCallback((file) => {
        previewTabRef.current = file;
        setPreviewTabState(file);
        if (root) saveJson(storageKey(root, "previewTab"), file);
      }, [root]);
      React.useEffect(() => {
        if (!root) { tabsRef.current = []; previewTabRef.current = ""; setTabs([]); setActive(""); setPreviewTabState(""); setTerminalOpen(false); return; }
        const saved = loadJson(storageKey(root, "tabs"), []);
        const existing = Array.isArray(saved) ? saved.filter((item) => typeof item === "string").slice(0, 20) : [];
        const tabModelVersion = loadJson(storageKey(root, "tabModelVersion"), 0);
        const next = tabModelVersion >= 2 ? existing : existing.slice(0, 1);
        if (tabModelVersion < 2) { saveJson(storageKey(root, "tabs"), next); saveJson(storageKey(root, "tabModelVersion"), 2); }
        const savedPreview = tabModelVersion >= 2 ? loadJson(storageKey(root, "previewTab"), "") : next[0] ?? "";
        const restoredPreview = typeof savedPreview === "string" && next.includes(savedPreview) ? savedPreview : "";
        tabsRef.current = next; previewTabRef.current = restoredPreview;
        setTabs(next); setActive(next[0] ?? "");
        setPreviewTabState(restoredPreview);
        setTerminalOpen(loadJson(storageKey(root, "terminalOpen"), false) === true);
      }, [root]);
      React.useEffect(() => {
        const listener = (event) => {
          const detail = event.detail;
          if (!detail?.root || !detail?.path || detail.root !== root) return;
          const previous = tabsRef.current;
          let next = previous;
          if (detail.mode === "preview") {
            if (!previous.includes(detail.path)) {
              const currentPreview = previewTabRef.current;
              const replaceable = currentPreview && previous.includes(currentPreview) && !dirtyRef.current[currentPreview];
              next = replaceable ? previous.map((file) => file === currentPreview ? detail.path : file) : [...previous, detail.path];
              setPreviewTab(detail.path);
            }
          } else {
            if (!previous.includes(detail.path)) next = [...previous, detail.path];
            if (previewTabRef.current === detail.path) setPreviewTab("");
          }
          if (next !== previous) { tabsRef.current = next; setTabs(next); saveJson(storageKey(root, "tabs"), next); }
          setActive(detail.path);
          if (detail.source === "tree" && detail.context !== "keep") setSingleContext(root, detail.path);
        };
        bus.addEventListener("open-file", listener); return () => bus.removeEventListener("open-file", listener);
      }, [root, setPreviewTab]);
      React.useEffect(() => {
        const listener = (event) => {
          const detail = event.detail;
          if (!root || detail.root !== root) return;
          setTabs((previous) => {
            const next = [...new Set(previous.map((file) => remapPath(file, detail.source, detail.destination)))];
            tabsRef.current = next; saveJson(storageKey(root, "tabs"), next); return next;
          });
          if (previewTabRef.current) setPreviewTab(remapPath(previewTabRef.current, detail.source, detail.destination));
          setActive((file) => remapPath(file, detail.source, detail.destination));
          setDirty((previous) => Object.fromEntries(Object.entries(previous).map(([file, value]) => [remapPath(file, detail.source, detail.destination), value])));
        };
        bus.addEventListener("file-moved", listener); return () => bus.removeEventListener("file-moved", listener);
      }, [root, setPreviewTab]);
      React.useEffect(() => { if (root && active) bus.dispatchEvent(new CustomEvent("active-file", { detail: { root, path: active } })); }, [root, active]);
      const markActiveDirty = React.useCallback((value) => {
        if (!active) return;
        if (value && previewTabRef.current === active) setPreviewTab("");
        setDirty((current) => current[active] === value ? current : { ...current, [active]: value });
      }, [active, setPreviewTab]);
      const close = (file) => {
        if (dirty[file] && !window.confirm(`${basename(file)} 尚未保存，仍要关闭吗？`)) return;
        setTabs((previous) => {
          const index = previous.indexOf(file); const next = previous.filter((item) => item !== file); saveJson(storageKey(root, "tabs"), next);
          tabsRef.current = next;
          if (previewTabRef.current === file) setPreviewTab("");
          if (active === file) setActive(next[Math.min(index, next.length - 1)] ?? ""); return next;
        });
      };
      const setTerminal = (value) => {
        setTerminalOpen(value);
        if (root) saveJson(storageKey(root, "terminalOpen"), value);
      };
      React.useEffect(() => {
        const onKey = (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "`") {
            event.preventDefault();
            setTerminal(!terminalOpen);
          }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      }, [terminalOpen, root]);
      if (!root) return h("div", { className: "dwu-root dwu-workspace" }, h("div", { className: "dwu-welcome" }, h("div", { className: "dwu-welcomeCard" }, h("div", { className: "dwu-welcomeIcon" }, "⌘"), h("div", { className: "dwu-welcomeTitle" }, "选择一个项目开始"), h("div", { className: "dwu-welcomeText" }, "从左侧项目栏打开文件夹；文件会在这里以标签页编辑或预览，AI 对话始终保留在右侧。"))));
      return h("div", { className: "dwu-root dwu-workspace" },
        h("div", { className: "dwu-workHead" }, h("span", { className: "dwu-workTitle" }, workspace.title), h("span", { className: "dwu-workPath", title: root }, root), h("button", { type: "button", className: "dwu-terminalToggle", "data-active": terminalOpen || undefined, "aria-label": "切换终端", "aria-pressed": terminalOpen, title: "切换终端（⌘/Ctrl + `）", onClick: () => setTerminal(!terminalOpen) }, h("span", { className: "dwu-terminalGlyph", "aria-hidden": true }, ">_"))),
        tabs.length > 0 && h("div", { className: "dwu-tabs" }, tabs.map((file) => h("button", { key: file, className: "dwu-tab", "data-active": file === active || undefined, "data-preview": file === previewTab || undefined, title: file === previewTab ? `${file}\n预览标签；双击固定` : file, onClick: () => setActive(file), onDoubleClick: () => { if (previewTabRef.current === file) setPreviewTab(""); } }, h(FileIcon, { file, size: 16 }), h("span", { className: "dwu-tabName" }, basename(file)), dirty[file] ? h("span", { className: "dwu-dirty" }, "●") : null, h("span", { className: "dwu-close", onClick: (event) => { event.stopPropagation(); close(file); } }, "×")))),
        h("div", { className: "dwu-main" },
          h("div", { className: "dwu-body" }, active ? h(FilePane, { key: `${root}:${active}`, root, file: active, onDirty: markActiveDirty }) : h("div", { className: "dwu-welcome" }, h("div", { className: "dwu-welcomeCard" }, h("div", { className: "dwu-welcomeIcon" }, "⌘"), h("div", { className: "dwu-welcomeTitle" }, "文件工作区"), h("div", { className: "dwu-welcomeText" }, "从左侧文件树选择文件。支持文本与 Markdown 编辑、PDF、Word、Excel、图片和视频预览。")))),
          terminalOpen && h(TerminalPanel, { key: root, root, onClose: () => setTerminal(false) })
        )
      );
    }

    function ContextDock({ useSessions }) {
      useBus("contexts");
      const sessions = useSessions((state) => state);
      const session = sessions.current ? sessions.byId[sessions.current] : undefined;
      const root = session?.cwd;
      if (!root) return null;
      const contexts = [...contextMap(root).keys()];
      if (contexts.length === 0) return null;
      return h("div", { className: "dwu-contextDock" }, h("span", { className: "dwu-contextLabel" }, "参考文件"), contexts.map((file) => h("button", { key: file, type: "button", className: "dwu-chip", title: `点击移除 · ${file}`, onClick: () => removeContext(root, file) }, h("span", { className: "dwu-chipDot" }), h("span", { className: "dwu-chipName" }, basename(file)), h("span", { className: "dwu-chipRemove", "aria-hidden": true }, "×"))));
    }

    function sessionTime(value) {
      const date = new Date(value || 0);
      if (!Number.isFinite(date.getTime())) return "";
      const today = new Date();
      const sameDay = date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate();
      if (sameDay) return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
      return date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" });
    }
    function HistoryIcon() {
      return h("svg", { className: "dwu-historyIcon", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true },
        h("path", { d: "M3.5 12a8.5 8.5 0 1 0 2.15-5.66L3.5 8.5", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" }),
        h("path", { d: "M3.5 4.5v4h4M12 7.7V12l3 1.8", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round" })
      );
    }
    function NewChatIcon() {
      return h("svg", { className: "dwu-newChatIcon", viewBox: "0 0 24 24", fill: "none", "aria-hidden": true },
        h("path", { d: "M5.2 5.2h8.6a5 5 0 0 1 5 5v2.3a5 5 0 0 1-5 5H9l-3.8 2.7v-3.7a4.9 4.9 0 0 1-2-4V10.2a5 5 0 0 1 2-5Z", stroke: "currentColor", strokeWidth: "1.65", strokeLinecap: "round", strokeLinejoin: "round" }),
        h("path", { d: "M11 8.2v5.6M8.2 11h5.6", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" })
      );
    }
    function SessionHistory({ useSessions, useWorkspaces, openSession, startSession }) {
      const { sessionState, session, workspace } = currentWorkspace(useSessions, useWorkspaces);
      const [open, setOpen] = React.useState(false);
      const rootRef = React.useRef(null);
      React.useEffect(() => {
        if (!open) return;
        const pointer = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false); };
        const keydown = (event) => { if (event.key === "Escape") setOpen(false); };
        window.addEventListener("pointerdown", pointer);
        window.addEventListener("keydown", keydown);
        return () => { window.removeEventListener("pointerdown", pointer); window.removeEventListener("keydown", keydown); };
      }, [open]);
      React.useEffect(() => { setOpen(false); }, [workspace?.workspaceId]);
      const rows = workspace ? workspace.sessionIds.map((id) => sessionState.byId[id]).filter(Boolean).filter((item) => item.origin !== "subagent").sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)) : [];
      return h("div", { className: "dwu-root dwu-historyRoot", "data-session": sessionState.current && session?.blank !== true || undefined, ref: rootRef },
        h("button", { type: "button", className: "dwu-newChatButton", title: "新对话", "aria-label": "新对话", onClick: () => { setOpen(false); startSession(workspace?.workspaceId); } }, h(NewChatIcon)),
        h("button", { type: "button", className: "dwu-historyButton", "data-open": open || undefined, title: "历史会话", "aria-label": "历史会话", "aria-expanded": open, disabled: !workspace, onClick: () => setOpen((value) => !value) }, h(HistoryIcon)),
        open && workspace && h("div", { className: "dwu-historyPopover", role: "dialog", "aria-label": "历史会话" },
          h("div", { className: "dwu-historyHead" }, h("div", { className: "dwu-historyTitle", title: workspace.title }, workspace.title), h("span", { className: "dwu-historyCount" }, `${rows.length} 个会话`)),
          h("div", { className: "dwu-historyList" }, rows.length === 0 ? h("div", { className: "dwu-historyEmpty" }, "这个项目还没有历史会话") : rows.map((row) => h("button", {
            key: row.id, type: "button", className: "dwu-historyRow", "data-active": row.id === sessionState.current || undefined,
            title: row.displayTitle || "未命名会话", onClick: () => { setOpen(false); if (row.id !== sessionState.current) openSession(row.id); }
          }, h("span", { className: "dwu-historyName" }, row.displayTitle || "未命名会话"), h("span", { className: "dwu-historyTime" }, sessionTime(row.updatedAt)), row.id === sessionState.current && h("span", { className: "dwu-historyCurrent" }, "当前会话"))))
        )
      );
    }

    const inject = ["slots", "sessions", "workspaces"];
    function apply(ctx) {
      const decorate = (sessionId, text) => {
        const session = ctx.sessions.list.getSnapshot().byId[sessionId];
        const root = session?.cwd;
        if (!root) return text;
        const enabled = [...contextMap(root)].filter(([, value]) => value).map(([file]) => file);
        if (enabled.length === 0) return text;
        let remaining = 36000;
        const files = snapshots.get(root);
        const sections = enabled.map((file) => {
          const snapshot = files?.get(file);
          if (!snapshot || typeof snapshot.content !== "string" || remaining <= 0) return `- ${file}`;
          const content = snapshot.content.slice(0, Math.min(12000, remaining)); remaining -= content.length;
          return `\n<file path="${file}">\n${content}\n</file>`;
        }).join("\n");
        return `${text}\n\n<workspace_context root="${root}">\n以下文件由用户在工作区中启用为本次对话上下文：\n${sections}\n</workspace_context>`;
      };
      window.__DSH_WORKSPACE_CONTEXT__ = { decorate };
      ctx.effect(() => () => { if (window.__DSH_WORKSPACE_CONTEXT__?.decorate === decorate) delete window.__DSH_WORKSPACE_CONTEXT__; }, "workspace context bridge");
      const originalOpenPath = ctx.workspaces.openPath.__dshCockpitOriginal ?? ctx.workspaces.openPath;
      const nativeOpenPath = (path) => originalOpenPath.call(ctx.workspaces, path);
      const routeConversationFile = async (path) => {
        const match = workspaceFileForHostPath(ctx.workspaces.list.getSnapshot().items, path);
        if (match) {
          try {
            const stat = await getJson(apiUrl("stat", match.root, match.path));
            if (!stat.directory) {
              bus.dispatchEvent(new CustomEvent("open-file", { detail: { root: match.root, path: match.path, mode: "pinned", source: "ai", context: "keep" } }));
              return;
            }
          } catch {}
        }
        return nativeOpenPath(path);
      };
      routeConversationFile.__dshCockpitOriginal = originalOpenPath;
      ctx.workspaces.openPath = routeConversationFile;
      ctx.effect(() => () => { if (ctx.workspaces.openPath === routeConversationFile) ctx.workspaces.openPath = originalOpenPath; }, "AI file tab routing");
      ctx.slots.inject("sidebar.workspaces", () => ctx.slots.register({
        name: "sidebar.workspaces",
        inject: () => ({
          pickProject: async () => {
            try {
              const path = await ctx.workspaces.pickDirectory(); if (!path) return;
              const workspace = await ctx.workspaces.create({ path }); ctx.workspaces.startSession(workspace.workspaceId);
            } catch (error) { window.alert(`无法打开项目：${error instanceof Error ? error.message : String(error)}`); }
          },
          openWorkspace: (workspace) => {
            const state = ctx.sessions.list.getSnapshot();
            const session = workspace.sessionIds.map((id) => state.byId[id]).filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt)[0];
            if (session) ctx.sessions.open(session.id); else ctx.workspaces.startSession(workspace.workspaceId);
          },
          openPath: (path) => nativeOpenPath(path).catch(() => {}),
          startProjectSession: (workspaceId) => ctx.workspaces.startSession(workspaceId),
          renameProject: (workspaceId, title) => ctx.workspaces.rename(workspaceId, title),
          deleteProject: (workspaceId) => ctx.workspaces.delete(workspaceId)
        })
      }, SidebarWorkspace));
      ctx.slots.inject("conversation.hero.workspace", () => ctx.slots.register({
        name: "conversation.hero.workspace",
        inject: () => ({
          pickDirectory: () => ctx.workspaces.pickDirectory(),
          createDirectory: (path, name) => ctx.workspaces.createDirectory(path, name),
          createWorkspace: (input) => ctx.workspaces.create(input)
        })
      }, ProjectPicker));
      ctx.slots.inject("workspace", () => ctx.slots.register({ name: "workspace" }, WorkspaceSurface));
      ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({ name: "conversation.input.dock", id: "workspace-context", order: -20 }, ContextDock));
      ctx.slots.inject("conversation.history", () => ctx.slots.register({
        name: "conversation.history",
        inject: () => ({
          openSession: (id) => ctx.sessions.open(id),
          startSession: (workspaceId) => ctx.workspaces.startSession(workspaceId)
        })
      }, SessionHistory));
    }
    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  }
});
