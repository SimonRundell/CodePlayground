/**
 * EditorPanel
 *
 * A single resizable code editor pane.  Consists of a coloured header bar
 * with the language label, an Undo button and a Copy button, followed by a
 * full-height monospace textarea.
 *
 * Ctrl+Z / Cmd+Z inside the textarea triggers the custom undo callback so
 * history is preserved across tab switches.  Tab key inserts two spaces
 * rather than moving focus.
 *
 * @param {Object}   props
 * @param {string}   props.label    - Editor label shown in the header ("HTML" | "CSS" | "JS").
 * @param {string}   props.value    - Current editor content (controlled).
 * @param {Function} props.onChange - Called with the new string on every keystroke.
 * @param {Function} props.onUndo   - Called to walk back one history snapshot.
 * @param {boolean}  props.canUndo  - Whether the undo button should be enabled.
 *
 * @license CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

import { useState, useCallback } from 'react';

/** Accent colours per language – used for the left border stripe. */
const ACCENT = { HTML: '#e5534b', CSS: '#3b82f6', JS: '#f59e0b' };

export default function EditorPanel({ label, value, onChange, onUndo, canUndo }) {
  const [copied, setCopied] = useState(false);

  /** Copy current editor content to clipboard and flash the button. */
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [value]);

  /**
   * Intercept Ctrl+Z for custom undo and Tab for indent-with-spaces.
   * @param {React.KeyboardEvent} e
   */
  const handleKeyDown = useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }

      if (e.key === 'Tab') {
        e.preventDefault();
        const { selectionStart: start, selectionEnd: end } = e.target;
        const next = value.substring(0, start) + '  ' + value.substring(end);
        onChange(next);
        requestAnimationFrame(() => {
          e.target.selectionStart = e.target.selectionEnd = start + 2;
        });
      }
    },
    [onUndo, onChange, value],
  );

  const accent = ACCENT[label] ?? '#64748b';

  return (
    <div className="editor-panel">
      <div className="editor-panel-header" style={{ borderLeftColor: accent }}>
        <span className="editor-panel-label" style={{ color: accent }}>
          {label}
        </span>
        <div className="editor-panel-actions">
          <button
            className={`ep-btn${canUndo ? '' : ' ep-btn--disabled'}`}
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            aria-label={`Undo last ${label} change`}
          >
            ↩ Undo
          </button>
          <button
            className={`ep-btn${copied ? ' ep-btn--copied' : ''}`}
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label={`Copy ${label} code`}
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      <textarea
        className="editor-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        aria-label={`${label} code editor`}
      />
    </div>
  );
}
