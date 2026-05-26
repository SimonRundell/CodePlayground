/**
 * App – MiniCodePen standalone playpen for Exeter College students.
 *
 * Layout:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  Header (logo + title + Run button)                      │
 *   ├──────────────────────┬───┬──────────────────────────────┤
 *   │  HTML editor         │   │                              │
 *   ├──────────────────────┤ ← │        Live Preview          │
 *   │  CSS editor          │   │                              │
 *   ├──────────────────────┤ ↕ │                              │
 *   │  JS editor           │   │                              │
 *   └──────────────────────┴───┴──────────────────────────────┘
 *
 * All three dividers are draggable:
 *   - Vertical bar  → resizes editor column vs preview column.
 *   - Two horizontal bars → redistribute height among the three editors.
 *
 * HTML and CSS changes update the preview automatically (300 ms debounce).
 * JavaScript only runs when the student clicks "▶ Run JS" to avoid
 * executing potentially infinite loops mid-keystroke.
 *
 * Each editor has independent 20-step undo history (debounced snapshot
 * every 800 ms of inactivity).
 *
 * @license CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import EditorPanel from './components/EditorPanel';
import CMFloatAd   from './components/CMFloatAd';
import { useEditorHistory } from './hooks/useEditorHistory';
import exeterLogo from '/exeter-college-black-text.svg';
import appLogo    from '/favicon.png';
import './App.css';

// ─── Starter scaffold ────────────────────────────────────────────────────────

const INITIAL_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <!-- Write your HTML here -->
  <h1>Hello, world!</h1>
  <p>This is a mini code playground to teach web development.</p>

  <script src="script.js"></script>
</body>
</html>`;

const INITIAL_CSS = `/* Write your CSS here */\n`;

const INITIAL_JS = `// Write your JavaScript here\n`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Assembles the srcdoc string for the preview iframe.
 *
 * Replaces the placeholder <link href="style.css"> tag with an inline
 * <style> block containing the current CSS, and the placeholder
 * <script src="script.js"> tag with an inline <script> block containing
 * the supplied JS string (empty string = no script injected).
 *
 * @param {string} html - Full HTML document from the editor.
 * @param {string} css  - CSS content from the CSS editor.
 * @param {string} js   - JS content to inject (empty until Run is clicked).
 * @returns {string}    - Complete HTML document for srcdoc.
 */
function buildSrcdoc(html, css, js) {
  let doc = html.replace(
    /<link\b[^>]*\bhref=["']style\.css["'][^>]*\/?>/gi,
    `<style>\n${css}\n</style>`,
  );
  doc = doc.replace(
    /<script\b[^>]*\bsrc=["']script\.js["'][^>]*><\/script>/gi,
    js ? `<script>\n${js}\n</script>` : '',
  );
  return doc;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function App() {
  // Per-editor state with undo history
  const html = useEditorHistory(INITIAL_HTML);
  const css  = useEditorHistory(INITIAL_CSS);
  const js   = useEditorHistory(INITIAL_JS);

  // JS that is currently executing in the preview.
  // Only updated when the student clicks Run so JS doesn't run mid-keystroke.
  const [runJs,      setRunJs]      = useState('');

  // Incrementing this key forces the iframe to fully remount on Run,
  // giving the JS a clean global scope.
  const [previewKey, setPreviewKey] = useState(0);

  // Debounced srcdoc: rebuilt 300 ms after HTML/CSS/runJs changes
  const [srcdoc, setSrcdoc] = useState(() => buildSrcdoc(INITIAL_HTML, INITIAL_CSS, ''));

  useEffect(() => {
    const t = setTimeout(() => {
      setSrcdoc(buildSrcdoc(html.value, css.value, runJs));
    }, 300);
    return () => clearTimeout(t);
  }, [html.value, css.value, runJs]);

  // ── Panel sizing ─────────────────────────────────────────────────────────
  // leftWidth: percentage of total workspace width occupied by the editor column
  const [leftWidth,    setLeftWidth]    = useState(38);
  // editorFlexes: flex-grow values for the three editor panels [HTML, CSS, JS]
  const [editorFlexes, setEditorFlexes] = useState([100, 100, 100]);

  // While dragging we show a transparent shield over the iframe so it doesn't
  // swallow mouse events.
  const [isDragging, setIsDragging] = useState(false);

  const workspaceRef = useRef(null);
  const editorColRef = useRef(null);

  // ── Run handler ──────────────────────────────────────────────────────────
  const handleRun = useCallback(() => {
    setRunJs(js.value);
    setPreviewKey((k) => k + 1);
  }, [js.value]);

  // ── Vertical drag (editor column ↔ preview) ──────────────────────────────
  const startVDrag = useCallback((e) => {
    e.preventDefault();
    const container = workspaceRef.current;
    if (!container) return;

    setIsDragging(true);
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';

    const rect = container.getBoundingClientRect();

    const onMove = (moveEvt) => {
      const x   = moveEvt.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setLeftWidth(Math.max(18, Math.min(65, pct)));
    };

    const onUp = () => {
      setIsDragging(false);
      document.body.style.cursor     = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
  }, []);

  // ── Horizontal drag (resize between two adjacent editors) ────────────────
  /**
   * Returns an onMouseDown handler for the divider between editors
   * [dividerIndex] and [dividerIndex + 1].
   * @param {number} dividerIndex - 0 = HTML/CSS boundary, 1 = CSS/JS boundary.
   */
  const startHDrag = useCallback(
    (dividerIndex) => (e) => {
      e.preventDefault();
      const col = editorColRef.current;
      if (!col) return;

      setIsDragging(true);
      document.body.style.cursor     = 'row-resize';
      document.body.style.userSelect = 'none';

      const colHeight = col.getBoundingClientRect().height;
      // Capture total flex at drag start for consistent delta-to-flex conversion
      const totalFlex = editorFlexes[0] + editorFlexes[1] + editorFlexes[2];
      let   lastY     = e.clientY;

      const onMove = (moveEvt) => {
        const deltaY    = moveEvt.clientY - lastY;
        lastY           = moveEvt.clientY;
        const deltaFlex = (deltaY / colHeight) * totalFlex;

        setEditorFlexes((prev) => {
          const next = [...prev];
          next[dividerIndex]     = Math.max(25, prev[dividerIndex]     + deltaFlex);
          next[dividerIndex + 1] = Math.max(25, prev[dividerIndex + 1] - deltaFlex);
          return next;
        });
      };

      const onUp = () => {
        setIsDragging(false);
        document.body.style.cursor     = '';
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup',   onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup',   onUp);
    },
    [editorFlexes],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="app-header">
        <div className="app-header-brand">
          <img src={exeterLogo} alt="Exeter College" className="header-logo" />
          <div className="header-text">
            <span className="header-title">Code Playground</span>
            <span className="header-subtitle">HTML · CSS · JS Playpen</span>
          </div>
          <img src={appLogo} alt="Code Playground" className="header-app-logo" />
        </div>

        <div className="header-controls">
          <span className="header-hint">
            HTML &amp; CSS preview updates live &nbsp;·&nbsp; click Run to execute JS
          </span>
          <button
            className="run-btn"
            onClick={handleRun}
            title="Run JavaScript (re-executes from scratch)"
          >
            ▶ Run JS
          </button>
        </div>
      </header>

      {/* ── Workspace ── */}
      <div className="workspace" ref={workspaceRef}>

        {/* Left: three stacked editors */}
        <div
          className="editor-column"
          ref={editorColRef}
          style={{ width: `${leftWidth}%` }}
        >
          <div className="editor-wrapper" style={{ flex: editorFlexes[0] }}>
            <EditorPanel
              label="HTML"
              value={html.value}
              onChange={html.onChange}
              onUndo={html.undo}
              canUndo={html.canUndo}
            />
          </div>

          <div
            className="h-divider"
            onMouseDown={startHDrag(0)}
            title="Drag to resize HTML / CSS editors"
          />

          <div className="editor-wrapper" style={{ flex: editorFlexes[1] }}>
            <EditorPanel
              label="CSS"
              value={css.value}
              onChange={css.onChange}
              onUndo={css.undo}
              canUndo={css.canUndo}
            />
          </div>

          <div
            className="h-divider"
            onMouseDown={startHDrag(1)}
            title="Drag to resize CSS / JS editors"
          />

          <div className="editor-wrapper" style={{ flex: editorFlexes[2] }}>
            <EditorPanel
              label="JS"
              value={js.value}
              onChange={js.onChange}
              onUndo={js.undo}
              canUndo={js.canUndo}
            />
          </div>
        </div>

        {/* Vertical drag handle */}
        <div
          className="v-divider"
          onMouseDown={startVDrag}
          title="Drag to resize editor / preview"
        />

        {/* Right: live preview */}
        <div className="preview-column">
          <div className="preview-label">Preview</div>
          <div className="preview-iframe-wrap">
            {isDragging && <div className="drag-shield" />}
            <iframe
              key={previewKey}
              className="preview-iframe"
              srcDoc={srcdoc}
              sandbox="allow-scripts"
              title="Live preview"
            />
          </div>
        </div>

      </div>

      <CMFloatAd color="#080808" bgColor="#f8fafc" />
    </div>
  );
}
