# Brand mark

`{✓}`: code braces around a check. It stands for computer science, practised
until the answer is right. The style matches the app's editor look.

| File                | Use                                                                      |
| ------------------- | ------------------------------------------------------------------------ |
| `mark.svg`          | Main mark (rounded tile), 128px and up: app icons, docs, social          |
| `mark-small.svg`    | Favicon variant: heavier strokes and a faint edge so it reads at 16–48px |
| `mark-maskable.svg` | Android adaptive icon: full-bleed, glyph inside the safe zone            |
| `mark-apple.svg`    | Apple touch icon: full-bleed (iOS rounds the corners)                    |

Colours are the dark-theme tokens in `src/styles/tokens.css`: tile `#0e0e10`
(`--bg`), braces `#6ea8fe` (`--accent`), check `#57ab5a` (`--green`). Keep the
tile dark in both themes; the icon is the same everywhere.

The PNGs and `favicon.ico` in `public/` are rendered from these SVGs. After
changing a mark, re-render them at the same sizes (16, 32, 48, 180, 192, 512)
and bump `VERSION` in `public/sw.js` so installed apps pick up the new icon.
