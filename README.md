# Code Playground

A browser-based HTML · CSS · JavaScript playground designed for Further Education students at Exeter College and beyond.  Write code in three side-by-side editors and see a live preview update instantly — no build step, no server, no sign-in required.

---

## Features

| Feature | Detail |
|---|---|
| **Three independent editors** | HTML, CSS and JavaScript panels with colour-coded headers |
| **Live preview** | HTML and CSS changes are reflected in the preview iframe within 300 ms |
| **Safe JS execution** | JavaScript only runs when the student clicks **▶ Run JS**, preventing runaway loops from firing mid-keystroke |
| **Clean JS scope** | Every Run remounts the iframe, giving JS a fresh global scope |
| **Per-editor undo** | Up to 20 snapshot steps per panel, debounced at 800 ms so rapid keystrokes don't flood the stack |
| **Keyboard shortcuts** | `Ctrl+Z` / `Cmd+Z` triggers the custom undo; `Tab` inserts two spaces |
| **Copy to clipboard** | One-click copy button in each editor header |
| **Draggable dividers** | Vertical divider resizes the editor column vs preview; two horizontal dividers redistribute height among the three editors |
| **Responsive branding** | Collapsed branding banner expands on hover to show full contact details; adapts to mobile layout |

---

## Tech Stack

- [React 19](https://react.dev/) – UI components and state management
- [Vite 8](https://vitejs.dev/) – dev server and production bundler
- [react-doctor](https://github.com/nickvdyck/react-doctor) – lint and architecture health checks
- Vanilla CSS – single stylesheet (`src/App.css`), no CSS framework
- No backend — everything runs in the browser

---

## Prerequisites

| Tool | Minimum version |
|---|---|
| Node.js | 18 |
| npm | 9 |

---

## Getting Started

```bash
# 1. Clone the repository
git clone <repository-url>
cd MiniCodePen

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Available Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the Vite dev server with hot module replacement |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build locally for inspection |
| `npm run lint` | Run ESLint across all source files |
| `npm run doctor` | Run react-doctor architecture health checks |

---

## Project Structure

```
MiniCodePen/
├── public/
│   ├── exeter_logo.svg        # Exeter College logo (header)
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── EditorPanel.jsx    # Single editor pane (header + textarea)
│   │   └── CMFloatAd.jsx      # Floating branding banner
│   ├── hooks/
│   │   └── useEditorHistory.js # Custom undo-history hook
│   ├── App.jsx                # Root component – layout and drag logic
│   ├── App.css                # All application styles (single file)
│   ├── index.css              # Minimal global reset
│   └── main.jsx               # React entry point
├── index.html
├── package.json
├── vite.config.js
└── eslint.config.js
```

---

## Architecture Notes

### Preview sandboxing

The preview uses an `<iframe srcdoc="...">` with `sandbox="allow-scripts"`.  The `buildSrcdoc()` helper in `App.jsx` replaces the two placeholder tags in the student's HTML scaffold:

- `<link href="style.css">` → inline `<style>` block containing the current CSS
- `<script src="script.js">` → inline `<script>` block, **only** injected after clicking Run

### Undo history (`useEditorHistory`)

Each editor maintains its own snapshot stack (up to 20 entries) stored in refs to avoid spurious re-renders.  A debounce timer (800 ms) batches rapid keystrokes into a single snapshot.  Undo walks the stack backwards; any new edit discards the redo future.

### Drag-to-resize

- **Vertical divider** (`v-divider`) — tracks `mousemove` on `window` and updates `leftWidth` (percentage of workspace).
- **Horizontal dividers** (`h-divider`) — adjust the `flex-grow` values of the three editor wrappers, keeping them within a 25-unit minimum so no panel collapses entirely.
- A transparent `drag-shield` overlay is applied over the iframe during any drag to prevent it capturing mouse events.

### CMFloatAd

The branding banner is `position: fixed` and right-anchored.  It uses `width: max-content` with `max-width` animated via CSS transition — this lets the element size exactly to its content when expanded and avoids a large empty leading edge.  The desktop text is always present in the DOM so the collapse transition (as well as expand) animates smoothly via `overflow: hidden`.

---

## License

Copyright © 2026 Simon Rundell, Department of ITDD, Exeter College, Hele Road, Exeter EX4 4JS.

This work is licensed under the **Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)** licence.

You are free to share and adapt this material for non-commercial purposes, provided you give appropriate credit, indicate if changes were made, and distribute your contributions under the same licence.

Full licence text: [https://creativecommons.org/licenses/by-nc-sa/4.0/](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## Author

**Simon Rundell**  
Department of Information Technology and Digital Design (ITDD)  
Exeter College, Hele Road, Exeter EX4 4JS  
Tel: 01392 400500  
Email: [simonrundell@exe-coll.ac.uk](mailto:simonrundell@exe-coll.ac.uk)
