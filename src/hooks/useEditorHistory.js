/**
 * useEditorHistory
 *
 * Custom hook that manages a code editor's text value together with an
 * undo history of up to MAX_HISTORY snapshots.
 *
 * Snapshots are captured DEBOUNCE_MS milliseconds after the user stops
 * typing, so rapid keystrokes don't flood the stack.  Undo walks the
 * snapshot stack backwards; once undone the redo future is discarded on
 * the next edit.
 *
 * @module useEditorHistory
 * @license CC BY-NC-SA 4.0 https://creativecommons.org/licenses/by-nc-sa/4.0/
 */

import { useState, useRef, useCallback } from 'react';

const MAX_HISTORY  = 20;
const DEBOUNCE_MS  = 800;

/**
 * @param {string} initialValue - Starting editor content.
 * @returns {{
 *   value:    string,
 *   onChange: (newValue: string) => void,
 *   undo:     () => void,
 *   canUndo:  boolean
 * }}
 */
export function useEditorHistory(initialValue) {
  /** Live display value – updates on every keystroke for controlled textarea. */
  const [value, setValue] = useState(initialValue);

  /**
   * Snapshot stack and current pointer.
   * Stored in refs so mutations don't trigger extra re-renders.
   */
  const historyRef = useRef([initialValue]);
  const indexRef   = useRef(0);

  /** Separate boolean state so the Undo button re-renders when availability changes. */
  const [canUndo, setCanUndo] = useState(false);

  const debounceRef = useRef(null);

  /**
   * Call on every textarea onChange event.
   * Immediately updates the displayed value; debounces the snapshot push.
   * @param {string} newValue
   */
  const onChange = useCallback((newValue) => {
    setValue(newValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const current = historyRef.current[indexRef.current];
      if (newValue === current) return;

      // Discard any redo future before pushing new state
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
      historyRef.current.push(newValue);

      if (historyRef.current.length > MAX_HISTORY) {
        historyRef.current.shift();
      }

      indexRef.current = historyRef.current.length - 1;
      setCanUndo(indexRef.current > 0);
    }, DEBOUNCE_MS);
  }, []);

  /**
   * Restores the previous snapshot from the history stack.
   */
  const undo = useCallback(() => {
    if (indexRef.current <= 0) return;
    indexRef.current -= 1;
    setValue(historyRef.current[indexRef.current]);
    setCanUndo(indexRef.current > 0);
  }, []);

  return { value, onChange, undo, canUndo };
}
