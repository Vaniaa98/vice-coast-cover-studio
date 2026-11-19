# Vice Coast Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Vaniaa98/vice-coast-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Vaniaa98/vice-coast-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

An offline web app that turns your photos and a caption into GTA-style cover art — the multi-panel poster look with bold lettering and a Vice City sunset or neon grade — and exports it as a PNG to share. Built for the [make.fun GTA 6 Cover Art bounty](https://make.fun/bounty/gta6-cover-art-01).

## How it works

1. **Photos** — pick from the eight built-in Vice City sample scenes, or drop in your own photos. Click a photo to put it in the selected panel, or drag it straight onto the cover.
2. **Layout** — nine multi-panel layouts: Hero + Grid, Whole Cast (9 panels), Hero + Three, Full Bleed, Tilted Snapshot, Slashed Comic, Six-Panel Hero, Story Strip, Duo Split.
3. **Grade** — six sunset/neon gradient-map grades (Sunset, Neon Coast, Vice Nights, Heat Wave, Chrome Dawn, Palm Noir), all skin-safe, plus poster ink, halftone title block and film grain.
4. **Lettering** — a giant gradient block title (Sunset / Chrome / Neon styles) with a neon script subtitle, a five-star press quote bar, and the full badge set: WANTED stars, EST. seal, VOL. ticket, COLLECTOR'S EDITION ribbon, ORIGINAL starburst — plus the palm-strip tagline, footer microcopy and barcode.
5. **Export** — one click per size, or all three at once: **1080 × 1080, 1080 × 1350, 1920 × 1080** PNG.

Every panel carries its own caption ("PLACE / TIME — flavour") or a character-role label (THE DRIVER, THE ANGLER, …). Click a panel to select it, drag the photo inside it to reposition, scroll to zoom — or use the sliders.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network request: every script, image and font is a file under `app/`, and your photos never leave your machine.

## Originality

All art is original — no Rockstar Games logo, wordmark, official artwork, character or font. The display fonts are vendored under `app/fonts/` under the SIL Open Font License (see `app/fonts/OFL.txt`): Anton, Bebas Neue, Pacifico. The eight sample photos were made with an image model for this entry.

## Entry

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library. Screenshots are taken deterministically from `?shot=` URLs (see `shots.json`).

## License

MIT — see [LICENSE](LICENSE).
