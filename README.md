# AlwaysShowActiveNow

Keeps the **Active Now column** (right side of the friends view) visible on much narrower windows than Discord allows by default - e.g. on a **portrait monitor**.

Discord hides the column via CSS (`display: none` through a media / container query) once the window gets too narrow. The snippet / plugin below overrides that and hides the column again only below a configurable width (650px in the example, roughly half of Discord's breakpoint). No horizontal scrollbar, no layout changes otherwise.

Built following https://docs.vencord.dev

## Method 1 (recommended): QuickCSS snippet

No build needed. Works with any regular Vencord install.

1. Go to Settings -> Vencord -> Themes -> `Edit QuickCSS` (or `Open QuickCSS File`).
2. Paste the snippet below and save. Adjust the `650px` and `320px` values to taste:

```css
/* Show Active Now on narrower windows, hide only below 650px */
[class*="tabBody_"] > [class*="nowPlayingColumn_"] {
  display: flex !important;
  visibility: visible !important;
  width: 320px !important;
  min-width: 320px !important;
}

@media (max-width: 650px) {
  [class*="tabBody_"] > [class*="nowPlayingColumn_"] {
    display: none !important;
    visibility: hidden !important;
  }
}
```

That is all. Restart Discord if it does not apply immediately.

## Method 2 (alternative): full plugin with settings UI

Same effect as Method 1, but with a settings UI (threshold, column width, compact mode) instead of fixed CSS values. Only needed if you want those options.

Custom plugins **only work with a Vencord source build**, not with the default installer. ([Docs](https://docs.vencord.dev/installing/custom-plugins))

Files in this repo:

```
alwaysShowActiveNow/
  index.ts   - plugin definition + settings
  style.css  - forces visibility, hides again below the threshold
```

Settings provided by the plugin:

| Setting | What it does |
|---|---|
| Keep Active Now visible | Master switch (off = default Discord behavior) |
| Hide below width (px) | Active Now is hidden only when the window is narrower than this. Default 650 |
| Width (px) | Width of the Active Now column |
| Compact mode | Smaller cards, less padding |

Installation:

1. Clone and prepare the Vencord repo (one-time setup):
   ```powershell
   git clone https://github.com/Vendicated/Vencord.git
   cd Vencord
   pnpm install
   ```
   If `pnpm` is missing: install Node.js LTS, then run `corepack enable`.

2. Create the `userplugins` folder:
   ```powershell
   New-Item -ItemType Directory -Path "src/userplugins" -Force
   ```

3. Copy the plugin folder from **this** repo:
   ```
   alwaysShowActiveNow/
   ```
   into:
   ```
   <path-to-Vencord>/src/userplugins/alwaysShowActiveNow/
   ```
   so that `index.ts` and `style.css` end up there. Example:
   ```powershell
   Copy-Item -Recurse "<path-to-this-repo>/alwaysShowActiveNow" "<path-to-Vencord>/src/userplugins/"
   ```

   Correct:
   - `src/userplugins/alwaysShowActiveNow/index.ts`
   - `src/userplugins/alwaysShowActiveNow/style.css`

   Wrong (doubly nested, will not load):
   - `src/userplugins/alwaysShowActiveNow/alwaysShowActiveNow/index.ts`

4. Build and inject:
   ```powershell
   pnpm build
   pnpm inject
   ```
   Select Discord / Vesktop when prompted.

5. Restart Discord, then go to Settings -> Vencord -> Plugins -> **AlwaysShowActiveNow**, enable it and open the gear icon to adjust the threshold and width.

> Do not leave empty folders or empty plugin files inside `src/userplugins` - that causes `TypeError: Cannot read properties of undefined (reading 'localeCompare')`.

## How it works

- No `patches` array, no Discord code rewrite - it does not break on updates and needs no restart to toggle.
- The base rule forces the column visible, overriding Discord's hide rule. Method 1 hides it again via a plain `@media (max-width: ...)` query; Method 2 toggles the `asa-hide-now` class on `body` through a `resize` listener when `window.innerWidth` drops below the configured threshold.
- Selectors only use stable prefixes (`nowPlayingColumn`, `tabBody`), no hash suffixes (such as `__133bf`) that change with every Discord update.
- If Discord ever stops rendering the column entirely (returning React `null` instead of just hiding it via CSS), pure CSS would not be enough. In that case, check DevTools: is there still a `nowPlayingColumn` div in the DOM on narrow windows? If not, a `patches`-based fallback would be needed.

## Notes for developers

- `style.css` is loaded as a `?managed` style via `enableStyle` / `disableStyle` from `@api/Styles`.
- The column width is applied through the `--asa-width` CSS variable, compact mode through the `asa-compact` body class, and the threshold through the `asa-hide-now` body class, all managed in `applySettings()` / `updateVisibility()`.
