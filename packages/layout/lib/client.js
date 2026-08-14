/*
 * DSH Workbench layout — modified from DeepSeek Harness ui-layout (MIT).
 * Modifications Copyright (C) 2026 Ethan. MIT License.
 * See ../../../THIRD_PARTY_NOTICES.md in the source distribution.
 */
window.__ModuleLoader__.load({
	id: "deepseek-harness-workbench-layout",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
		/** Viewport width below which the sidebar auto-collapses to the rail (deepsuite
		* LG breakpoint); a manual toggle below it re-expands over the squeezed center
		* (stores.ts narrowExpanded). */
		const SIDEBAR_AUTO_COLLAPSE = 1024;
		/**
		* Clamp a panel width into its contract range.
		* @param px - requested width.
		* @param min - range lower bound.
		* @param max - range upper bound.
		* @returns the clamped width.
		*/
		function clampWidth(px, min, max) {
			return Math.min(max, Math.max(min, Math.round(px)));
		}
		function restoredWidth(key, fallback, min, max, allowClosed = false) {
			try {
				const value = Number(localStorage.getItem(key));
				if (allowClosed && value === 0) return 0;
				if (Number.isFinite(value) && value >= min && value <= max) return value;
			} catch {}
			return fallback;
		}
		/**
		* Solve the three column widths for one viewport frame. Pure: no hysteresis —
		* the output is a function of (viewport, preferences) only, so recovery on
		* re-widening is automatic. Preferences re-clamp here because they cross the
		* store boundary and callers may still supply stale ranges.
		* @param viewport - available frame width in px.
		* @param sidebar - sidebar width preference in px (0 = closed).
		* @param right - right conversation-panel width preference in px (0 = closed).
		* @returns resolved widths; right 0 means visually closed (kept mounted), while a closed sidebar keeps its compact rail.
		*/
		function computeColumns(viewport, sidebar, right) {
			const s = sidebar === 0 ? 56 : clampWidth(sidebar, 232, 640);
			const r0 = right === 0 ? 0 : clampWidth(right, 280, 720);
			if (s + r0 + 420 <= viewport) return {
				sidebar: s,
				center: viewport - s - r0,
				right: r0
			};
			const r1 = r0 === 0 ? 0 : Math.max(280, viewport - s - 420);
			if (s + r1 + 420 <= viewport) return {
				sidebar: s,
				center: 420,
				right: r1
			};
			return {
				sidebar: s,
				center: Math.max(0, viewport - s),
				right: 0
			};
		}
		//#endregion
		//#region \0dsh-css:/home/runner/work/deepseek-harness/deepseek-harness/packages/client/ui-layout/src/client/AppFrame.module.css.mjs
		const css = ".pI_x6G_frame{background:var(--dsw-alias-bg-base);height:100%;transition:grid-template-columns var(--ds-transition-duration-slow) var(--ds-ease-in-out);grid-template-rows:100%;display:grid;position:relative;overflow:hidden}.pI_x6G_frame[data-dragging]{transition:none}@media (prefers-reduced-motion:reduce){.pI_x6G_frame{transition:none}}.pI_x6G_sidebarCol{background:var(--dsw-specific-sidebar-fill);border-right:1px solid var(--dsw-alias-border-l1);min-width:0;overflow:hidden}.pI_x6G_centerCol{flex-direction:column;min-width:0;display:flex;overflow:hidden}.pI_x6G_detailsCol{border-left:1px solid var(--dsw-alias-border-l2);min-width:0;overflow:hidden}.pI_x6G_frame[data-details-collapsed] .pI_x6G_detailsCol{border-left:none}.pI_x6G_handle{cursor:col-resize;z-index:2;touch-action:none;width:8px;transition:left var(--ds-transition-duration-slow) var(--ds-ease-in-out);margin-left:-4px;position:absolute;top:0;bottom:0}.pI_x6G_frame[data-dragging] .pI_x6G_handle{transition:none}@media (prefers-reduced-motion:reduce){.pI_x6G_handle{transition:none}}.pI_x6G_handle[data-side=details]:after{content:\"\";box-sizing:border-box;background:var(--dsw-alias-button-floating-fill);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);opacity:0;width:12px;height:32px;transition:opacity var(--ds-transition-duration-slow) var(--ds-ease-in-out), background var(--ds-transition-duration-slow) var(--ds-ease-in-out);border-radius:10px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.pI_x6G_detailsCol:hover~.pI_x6G_handle[data-side=details]:after,.pI_x6G_handle[data-side=details]:hover:after,.pI_x6G_handle[data-side=details][data-dragging=true]:after{opacity:1}.pI_x6G_handle[data-side=details]:hover:after,.pI_x6G_handle[data-side=details][data-dragging=true]:after{background:var(--dsw-alias-button-floating-hover);border-color:var(--dsw-alias-border-l3)}.pI_x6G_overlayLayer{z-index:20;pointer-events:none;position:absolute;inset:0}.pI_x6G_overlayLayer>*{pointer-events:auto}";
		const tagId = "deepseek-harness-workbench-layout/AppFrame.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deepseek-harness-workbench-layout";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		// DSH desktop workspace shell: the conversation is a persistent right
		// column, the middle column is a plugin-owned workspace, and the existing
		// tool details surface overlays the workspace instead of opening a fourth
		// column.
		const workspaceShellCss = ".pI_x6G_workspaceCol{background:var(--dsw-alias-bg-base);position:relative;min-width:0;display:flex;flex-direction:column;overflow:hidden}.pI_x6G_rightCol{background:var(--dsw-alias-bg-base);border-left:1px solid var(--dsw-alias-border-l2);min-width:0;display:flex;flex-direction:column;overflow:hidden;position:relative}.pI_x6G_frame[data-right-collapsed] .pI_x6G_rightCol{border-left:0}.pI_x6G_historySlot{position:absolute;z-index:16;top:10px;right:12px;pointer-events:none}.pI_x6G_historySlot>*{pointer-events:auto}.pI_x6G_detailsOverlay{position:absolute;inset:0;z-index:10;background:var(--dsw-alias-bg-base);display:flex;flex-direction:column;overflow:hidden}.pI_x6G_detailsOverlay[data-closed]{visibility:hidden;pointer-events:none}.pI_x6G_handle[data-side=sidebar],.pI_x6G_handle[data-side=right]{width:14px;margin-left:-7px}.pI_x6G_handle[data-side=sidebar]:after,.pI_x6G_handle[data-side=right]:after{content:\"\";box-sizing:border-box;background:var(--dsw-alias-button-floating-fill);border:1px solid var(--dsw-alias-border-l2-darkmode-thin);opacity:.48;width:8px;height:52px;transition:opacity 160ms ease-out,background 160ms ease-out,border-color 160ms ease-out;border-radius:10px;position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}.pI_x6G_handle[data-side=sidebar]:hover:after,.pI_x6G_handle[data-side=sidebar][data-dragging=true]:after,.pI_x6G_handle[data-side=right]:hover:after,.pI_x6G_handle[data-side=right][data-dragging=true]:after{opacity:1;background:var(--dsw-alias-button-floating-hover);border-color:var(--dsw-alias-border-l3)}.pI_x6G_rightToggle{position:absolute;z-index:12;top:14px;width:28px;height:28px;border:0;border-radius:50%;background:transparent;color:var(--dsw-alias-label-secondary);display:grid;place-items:center;padding:0;cursor:pointer;box-shadow:none;transition:right var(--ds-transition-duration-slow) var(--ds-ease-in-out),background-color 140ms ease,color 140ms ease,transform 140ms cubic-bezier(.23,1,.32,1)}.pI_x6G_rightToggle:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}.pI_x6G_rightToggle:active{transform:scale(.96)}.pI_x6G_rightPanelIcon{display:block;transform:scaleX(-1)}";
		const workspaceShellTagId = "deepseek-harness-workbench-layout/workspace-shell.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(workspaceShellTagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "deepseek-harness-workbench-layout";
			tag.dataset.pluginCss = workspaceShellTagId;
			tag.textContent = workspaceShellCss;
			document.head.appendChild(tag);
		}
		var AppFrame_module_css_default = {
			"detailsCol": "pI_x6G_detailsCol",
			"sidebarCol": "pI_x6G_sidebarCol",
			"overlayLayer": "pI_x6G_overlayLayer",
			"handle": "pI_x6G_handle",
			"frame": "pI_x6G_frame",
			"centerCol": "pI_x6G_centerCol",
			"rightCol": "pI_x6G_rightCol",
			"workspaceCol": "pI_x6G_workspaceCol",
			"historySlot": "pI_x6G_historySlot",
			"detailsOverlay": "pI_x6G_detailsOverlay",
			"rightToggle": "pI_x6G_rightToggle"
		};
		//#endregion
		//#region lib/types/client/AppFrame.js
		/**
		* Three-column shell frame, registered into the built-in 'root' slot (the web
		* shell renders only 'root'). Owns the grid tracks (sidebar | center |
		* details), the drag handles (pointer capture + rAF throttle), the concession
		* chain (columns.ts), and the child-slot render decisions: the sidebar slot
		* renders HERE with live parameters from the concession solve, and the
		* session-aware occupants render in fixed column positions; strict entries
		* gate themselves on current-session availability while session-maybe
		* entries retain identity. Pure component: everything arrives
		* through the three framework shares — zero cordis or framework imports,
		* zero self-made hooks.
		*/
		/** Center column grid item (session-body building block). */
		function CenterColumn(props) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: AppFrame_module_css_default.centerCol,
				children: props.children
			});
		}
		/** Details column grid item; width 0 keeps the subtree mounted (never unmount on close). */
		function DetailsColumn(props) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: AppFrame_module_css_default.detailsCol,
				children: props.children
			});
		}
		function WorkspaceColumn(props) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: AppFrame_module_css_default.workspaceCol,
				children: props.children
			});
		}
		function RightColumn(props) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: AppFrame_module_css_default.rightCol,
				children: props.children
			});
		}
		/**
		* One drag handle: pointer capture, rAF-throttled dx reports against the drag-start origin.
		* `side` keys the hover-reveal CSS to the owning column.
		*/
		function DragHandle(props) {
			const [dragging, setDragging] = (0, react.useState)(false);
			const origin = (0, react.useRef)(0);
			const latest = (0, react.useRef)(0);
			const frame = (0, react.useRef)(null);
			const callbacks = (0, react.useRef)({
				onStart: props.onStart,
				onDrag: props.onDrag,
				onEnd: props.onEnd
			});
			callbacks.current = {
				onStart: props.onStart,
				onDrag: props.onDrag,
				onEnd: props.onEnd
			};
			const onPointerDown = (0, react.useCallback)((e) => {
				e.preventDefault();
				e.currentTarget.setPointerCapture(e.pointerId);
				origin.current = e.clientX;
				latest.current = e.clientX;
				callbacks.current.onStart();
				setDragging(true);
			}, []);
			const onPointerMove = (0, react.useCallback)((e) => {
				if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
				latest.current = e.clientX;
				frame.current ??= requestAnimationFrame(() => {
					frame.current = null;
					callbacks.current.onDrag(latest.current - origin.current);
				});
			}, []);
			const onPointerUp = (0, react.useCallback)((e) => {
				if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
				e.currentTarget.releasePointerCapture(e.pointerId);
				if (frame.current !== null) {
					cancelAnimationFrame(frame.current);
					frame.current = null;
				}
				callbacks.current.onDrag(latest.current - origin.current);
				setDragging(false);
				callbacks.current.onEnd();
			}, []);
			return (0, react_jsx_runtime.jsx)("div", {
				className: AppFrame_module_css_default.handle,
				style: { left: props.left },
				"data-side": props.side,
				"data-dragging": dragging || void 0,
				onPointerDown,
				onPointerMove,
				onPointerUp
			});
		}
		/** The three-column frame (see module doc). */
		function AppFrame({ useStore, useSessions, actions, renderSlot }) {
			const panels = useStore((s) => s);
			const detailsSession = useSessions((s) => {
				const current = s.current;
				return current !== void 0 && s.byId[current]?.blank === false ? current : void 0;
			});
			const frameRef = (0, react.useRef)(null);
			const [viewport, setViewport] = (0, react.useState)(() => window.innerWidth);
			const lastSession = (0, react.useRef)(detailsSession);
			(0, react.useLayoutEffect)(() => {
				if (detailsSession === void 0) return;
				if (lastSession.current !== void 0 && lastSession.current !== detailsSession) actions.closeDetails();
				lastSession.current = detailsSession;
			}, [actions, detailsSession]);
			(0, react.useEffect)(() => {
				const el = frameRef.current;
				/* v8 ignore next -- the ref is always attached by effect time: the frame div renders unconditionally. */
				if (el === null) return;
				let raf = null;
				const observer = new ResizeObserver(() => {
					raf ??= requestAnimationFrame(() => {
						raf = null;
						const width = el.getBoundingClientRect().width;
						if (width > 0) setViewport(width);
					});
				});
				observer.observe(el);
				return () => {
					observer.disconnect();
					if (raf !== null) cancelAnimationFrame(raf);
				};
			}, []);
			const narrow = viewport < SIDEBAR_AUTO_COLLAPSE;
			(0, react.useEffect)(() => {
				actions.setNarrow(narrow);
			}, [actions, narrow]);
			const sidebarCollapsed = narrow ? !panels.narrowExpanded : panels.sidebar === 0;
			const cols = computeColumns(viewport, sidebarCollapsed ? 0 : panels.sidebar === 0 ? 280 : panels.sidebar, panels.right);
			const colsRef = (0, react.useRef)(cols);
			colsRef.current = cols;
			const sidebarBase = (0, react.useRef)(0);
			const rightBase = (0, react.useRef)(0);
			const [dragging, setDragging] = (0, react.useState)(false);
			const onDragEnd = (0, react.useCallback)(() => {
				setDragging(false);
			}, []);
			const onSidebarStart = (0, react.useCallback)(() => {
				sidebarBase.current = colsRef.current.sidebar;
				setDragging(true);
			}, []);
			const onRightStart = (0, react.useCallback)(() => {
				rightBase.current = colsRef.current.right;
				setDragging(true);
			}, []);
			const onSidebarDrag = (0, react.useCallback)((dx) => {
				actions.setSidebar(sidebarBase.current + dx);
			}, [actions]);
			const onRightDrag = (0, react.useCallback)((dx) => {
				actions.setRight(rightBase.current - dx);
			}, [actions]);
			(0, react.useEffect)(() => {
				try {
					localStorage.setItem("dsh.layout.sidebar", String(panels.sidebar));
					localStorage.setItem("dsh.layout.right", String(panels.right));
				} catch {}
			}, [panels.sidebar, panels.right]);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
						event.preventDefault();
						actions.toggleSidebar();
						return;
					}
					if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "j") {
						event.preventDefault();
						actions.toggleRight();
					}
				};
				window.addEventListener("keydown", onKeyDown);
				return () => window.removeEventListener("keydown", onKeyDown);
			}, [actions]);
			return (0, react_jsx_runtime.jsxs)("div", {
				ref: frameRef,
				className: AppFrame_module_css_default.frame,
				style: { gridTemplateColumns: `${cols.sidebar}px minmax(0, 1fr) ${cols.right}px` },
				"data-sidebar-collapsed": sidebarCollapsed || void 0,
				"data-right-collapsed": cols.right === 0 || void 0,
				"data-dragging": dragging || void 0,
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: AppFrame_module_css_default.sidebarCol,
						children: renderSlot("sidebar", {
							collapsed: sidebarCollapsed,
							width: cols.sidebar
						})
					}),
					(0, react_jsx_runtime.jsxs)(WorkspaceColumn, { children: [renderSlot("workspace", {}), (0, react_jsx_runtime.jsx)("div", {
						className: AppFrame_module_css_default.detailsOverlay,
						"data-closed": panels.details === 0 || detailsSession === void 0 || void 0,
						children: renderSlot("details", {})
					})] }),
					(0, react_jsx_runtime.jsxs)(RightColumn, { children: [renderSlot("conversation", {}), (0, react_jsx_runtime.jsx)("div", { className: AppFrame_module_css_default.historySlot, children: renderSlot("conversation.history", {}) })] }),
					(0, react_jsx_runtime.jsx)("div", {
						className: AppFrame_module_css_default.overlayLayer,
						"data-shell-overlay": true,
						children: renderSlot("shell.overlay", {})
					}),
					!sidebarCollapsed && (0, react_jsx_runtime.jsx)(DragHandle, {
						side: "sidebar",
						left: cols.sidebar,
						onStart: onSidebarStart,
						onDrag: onSidebarDrag,
						onEnd: onDragEnd
					}),
					cols.right > 0 && (0, react_jsx_runtime.jsx)(DragHandle, {
						side: "right",
						left: viewport - cols.right,
						onStart: onRightStart,
						onDrag: onRightDrag,
						onEnd: onDragEnd
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: AppFrame_module_css_default.rightToggle,
						style: { right: cols.right > 0 ? cols.right + 8 : 12 },
						title: cols.right > 0 ? "折叠 AI 工作区 (⌘J)" : "展开 AI 工作区 (⌘J)",
						"aria-label": cols.right > 0 ? "折叠 AI 工作区" : "展开 AI 工作区",
						onClick: actions.toggleRight,
						children: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconPanelLeftOutline16, {
							size: 16,
							className: "pI_x6G_rightPanelIcon"
						})
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/stores.js
		/**
		* The root entry's transient layout store: panel geometry as plain widths in
		* px (0 = closed). Module level exports the factory only — a module-level
		* handle would pin the store's identity in the module
		* cache (a de-facto singleton surviving plugin reloads). register() receives
		* the factory (exclusive use: the framework instantiates per entry), AppFrame
		* derives its PropsStore share from the return type, and the service face
		* receives the bound actions through the registration's inject hook.
		*/
		/**
		* Create the layout panel store handle. The preference IS the width, so
		* closing a panel forgets its drag width — reopening restores the contract
		* default. Actions are the complete write set: drag writes clamp
		* into the panel's contract range and never cross the open/closed line;
		* open/close transitions write 0 / the default explicitly. Below the
		* auto-collapse breakpoint (AppFrame feeds setNarrow) the sidebar toggle
		* flips the narrowExpanded override instead of the preference.
		* @returns the store handle (spec + type + identity + factory in one).
		*/
		function createLayoutStore() {
			return (0, _deepseek_ai_dsh_client_runtime_client.defineStore)({
				init: () => ({
					sidebar: restoredWidth("dsh.layout.sidebar", 280, 232, 640, true),
					right: restoredWidth("dsh.layout.right", 420, 280, 720, true),
					details: 0,
					narrow: false,
					narrowExpanded: false
				}),
				actions: {
					setSidebar: (d, px) => {
						d.sidebar = clampWidth(px, 232, 640);
					},
					setDetails: (d, px) => {
						d.details = clampWidth(px, 300, 520);
					},
					setRight: (d, px) => {
						d.right = clampWidth(px, 280, 720);
					},
					toggleSidebar: (d) => {
						if (d.narrow) d.narrowExpanded = !d.narrowExpanded;
						else d.sidebar = d.sidebar === 0 ? 280 : 0;
					},
					setNarrow: (d, narrow) => {
						if (d.narrow === narrow) return;
						d.narrow = narrow;
						d.narrowExpanded = false;
					},
					openDetails: (d) => {
						if (d.details === 0) d.details = 360;
					},
					closeDetails: (d) => {
						d.details = 0;
					},
					toggleRight: (d) => {
						d.right = d.right === 0 ? 420 : 0;
					}
				}
			});
		}
		//#endregion
		//#region lib/types/client/service.js
		/** Cross-plugin panel-action face (ctx.layout). */
		var LayoutController = class {
			#panels;
			/**
			* Adopt the root entry's bound store actions. Called from the root
			* registration's inject hook (a sanctioned assembly side effect), so the
			* face is live from the entry's first render; on entry re-register the
			* fresh actions overwrite the stale set.
			* @param actions - bound actions of the entry's layout store instance.
			*/
			attachPanels(actions) {
				this.#panels = actions;
			}
			/** Toggle the sidebar panel (closed ⟷ contract default width). */
			toggleSidebar() {
				this.#require().toggleSidebar();
			}
			toggleRight() {
				this.#require().toggleRight();
			}
			/** Open the details panel (no-op when already open). */
			openDetails() {
				this.#require().openDetails();
			}
			/** Close the details panel. */
			closeDetails() {
				this.#require().closeDetails();
			}
			#require() {
				if (this.#panels === void 0) throw new Error("layout: panel actions not wired (root entry not mounted)");
				return this.#panels;
			}
		};
		//#endregion
		//#region lib/types/client/theme-presenter.js
		/** Body attribute selecting the dark base palette in the token stylesheets. */
		const DARK_ATTRIBUTE = "data-ds-dark-theme";
		/** Applies theme snapshots to the document; one instance per plugin fiber. */
		var ThemePresenter = class {
			/** Token names this presenter wrote in the last apply (its retraction set). */
			appliedTokens = [];
			/** The single metadata node this presenter inserts and removes. */
			themeColorMeta;
			/** Create the presenter-owned metadata node before the first snapshot arrives. */
			constructor() {
				this.themeColorMeta = document.createElement("meta");
				this.themeColorMeta.name = "theme-color";
			}
			/**
			* Project a snapshot onto the document: set root `color-scheme` and the body
			* palette attribute from `active.colorScheme` (never the id — `system` is
			* resolved upstream), then replace the previously applied token variables
			* with `active.tokens`. Browser theme-color metadata follows the computed
			* body background after those writes, so the rendered palette remains the
			* color authority.
			* @param snapshot - resolved theme snapshot from ctx.theme.
			*/
			apply(snapshot) {
				const scheme = snapshot.active.colorScheme;
				document.documentElement.style.colorScheme = scheme;
				const body = document.body;
				if (scheme === "dark") body.setAttribute(DARK_ATTRIBUTE, "");
				else body.removeAttribute(DARK_ATTRIBUTE);
				for (const name of this.appliedTokens) body.style.removeProperty(name);
				this.appliedTokens = [];
				for (const [name, value] of Object.entries(snapshot.active.tokens)) {
					body.style.setProperty(name, value);
					this.appliedTokens.push(name);
				}
				this.themeColorMeta.content = getComputedStyle(body).backgroundColor;
				if (!this.themeColorMeta.isConnected) document.head.append(this.themeColorMeta);
			}
			/** Retract root color-scheme, the palette attribute, token variables, and the owned metadata node. */
			dispose() {
				document.documentElement.style.removeProperty("color-scheme");
				const body = document.body;
				body.removeAttribute(DARK_ATTRIBUTE);
				for (const name of this.appliedTokens) body.style.removeProperty(name);
				this.appliedTokens = [];
				this.themeColorMeta.remove();
			}
		};
		//#endregion
		//#region lib/types/client/index.js
		/** Required services (cordis fiber inject — the loader passes all module exports as an object plugin). */
		const inject = ["slots", "theme"];
		/**
		* Client plugin body: provide ctx.layout, then one register() call — AppFrame
		* into 'root' with the four child-slot declarations, the layout store seat,
		* and the inject hook that hands the store's bound actions to the service.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const layout = new LayoutController();
			ctx.effect(() => {
				const disposeService = ctx.reflect.provide("layout", layout);
				const disposeRegistration = ctx.slots.register({
					name: "root",
					children: {
						"sidebar": {
							kind: "single",
							scope: "root"
						},
							"conversation": {
								kind: "single",
								scope: "session-maybe"
							},
							"conversation.history": {
								kind: "single",
								scope: "root"
							},
						"workspace": {
							kind: "single",
							scope: "root"
						},
						"details": {
							kind: "single",
							scope: "session"
						},
						"shell.overlay": {
							kind: "list",
							scope: "root"
						}
					},
					store: createLayoutStore,
					inject: (actions) => {
						layout.attachPanels(actions);
						return {};
					}
				}, AppFrame);
				return () => {
					disposeRegistration();
					disposeService();
				};
			}, "ui-layout: service + root registration");
			ctx.effect(() => {
				const presenter = new ThemePresenter();
				presenter.apply(ctx.theme.getTheme());
				const off = ctx.on("theme/change", (snapshot) => {
					presenter.apply(snapshot);
				});
				return () => {
					off();
					presenter.dispose();
				};
			}, "ui-layout: theme presenter");
		}
		//#endregion
		exports.LayoutController = LayoutController;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map
