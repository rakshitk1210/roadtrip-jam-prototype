# Roadtrip Jam — Seattle → North Cascades

A mobile-web prototype of the **Roadtrip Jam** flow from the Figma file
[Playground / section 1436:13995](https://www.figma.com/design/SkeL1hPeH14hgjr1h4akzz/Playground?node-id=1436-13995),
built on a live Mapbox map styled to the avocado palette.

```bash
npm install && npm run dev
```

Then open http://localhost:5173. It fills the screen on a phone and renders as a
402×872 device on a desktop viewport.

## The flow

1. **You tab** — the *Seattle to North Cascades* Roadtrip Jam card. Tap it.
2. **Trip map** — the route drawn Seattle → North Cascades, saved bookmark pins,
   and place stickers. The bottom sheet opens on **Itinerary**; drag its handle
   between three snaps. The camera re-pads as the sheet moves, so the jam stays
   centred in whatever strip of map is still visible.
3. **Zoom past 11.5** — 🍕 🍔 🌮 ☕ 🍦 🍩 fade in as circular chips.
4. **Tap the Outback Kangaroo Farm sticker** — the map flies in and the detail
   sheet takes over.
5. **Three actions** — *Add stop* re-draws the route through the place,
   *Add to itinerary* prepends it to Morning, *Mark as Gem* drops a violet
   diamond on the map and beside the rating. Gem toggles off on a second tap.
6. **Close** — state persists. **On Your Route** holds *Saved*,
   *From your friends*, and *From travel creators* (people who have never been
   on this jam).

### Every place opens the same sheet

Tapping a **Saved** row (Mountain View Café, Diablo lake hike…) or an
**Itinerary** row opens the same detail sheet the Kangaroo Farm uses — its own
hours, photos, "Know before you go", and the same add-stop / add-to-itinerary /
mark-as-gem actions. The map flies to that place, and gemming it from the list
shows the diamond on its bookmark pin.

The row's own bookmark and `+ Itinerary` buttons still act on their own — they
swallow the row tap rather than opening the sheet.

Friends' and creators' cards are *itineraries*, not places, so they stay
non-tappable: "mark this trip as a gem" isn't a thing yet.

On the map, the Kangaroo Farm sticker is the only tappable marker — the rest is
scenery (`pointer-events: none`), as originally specced. The saved pins do react
to gem state even though you can't tap them.

## Layout

```
src/
  map/avocadoStyle.ts   Google Maps style array ported to the Mapbox style spec
  map/MapCanvas.tsx     map init, route layers, sheet-aware camera
  map/MapMarkers.tsx    stickers / pins / emoji POIs as React portals into Markers
  sheet/                three-snap drag sheet + Itinerary, On Your Route, detail
  screens/              YouScreen, TripMapScreen
  state/                tripContext.ts (context + hook), tripStore.tsx (provider)
  data/places.ts        Place records, saved list, trip recommendations
  data/directions.ts    live Directions lookup + driving-order sort for stops
  data/routes.json      cached Mapbox Directions geometry (direct + with stop)
  styles/               tokens.css, map.css, ui.css
public/assets/          PNG/JPG/SVG exported from the Figma file
```

## Notes on fidelity

- **The avocado style.** The supplied style array is Google Maps syntax, so it's
  re-authored against `mapbox://mapbox.mapbox-streets-v8` in
  [`src/map/avocadoStyle.ts`](src/map/avocadoStyle.ts): land `#ABCE83`, water
  `#AEE2E0`, highways `#EBF4A4`. Its first rule turns **all labels off**, so the
  style declares no symbol layers at all — every word on the map comes from our
  own HTML markers. The array also switches arterial and local roads off; those
  classes are held back to z≥11 and z≥12 instead of cut, because the comps show
  a pale road mesh once you zoom in on the farm.
- **Icons** are the real Material Symbols Rounded webfont, not traced SVG. The
  Figma components carry Material's own keyword lists (`chevron_right`,
  `local_cafe`, `drag_indicator`), so the font is the same artwork at the right
  optical size and inherits `currentColor`.
- **Type** is Roboto. Google Sans Flex, which the file uses, is not public.
- **Coordinates are real** — Outback Kangaroo Farm sits at its actual Arlington,
  WA location, which is why the route runs I-5 north before turning east on
  SR-20. The Figma composition places the sticker a little further north.
- **The route** is cached Mapbox Directions geometry in
  [`src/data/routes.json`](src/data/routes.json) (simplified to ~160 points), so
  the map never renders empty because a network call failed. Adding a stop other
  than the farm asks Directions live, sorting the stops into driving order
  first, and falls back to the cached line if that call fails.
- **The photo pool is thin.** The Figma yields only three visually distinct
  landscape shots, so saved places share them in rotating permutations — no
  collage repeats an image within itself, but sets recur across places. Real
  photography drops straight into `photos` / `thumb` in
  [`src/data/places.ts`](src/data/places.ts).

## Token

`VITE_MAPBOX_TOKEN` lives in a committed `.env`, so the repo runs on clone with
no setup. That is deliberate: `pk.` tokens are Mapbox's *public* scope, meant to
be embedded in client-side code, and it ships inside the JS bundle either way.

**Before making this repo public**, restrict the token by URL in the Mapbox
account (Account → Tokens → the token → URL restrictions). An unrestricted
public token that ends up on a public repo will get scraped and billed to you.

To use your own token instead, drop it in `.env.local` — that file is gitignored
and takes precedence over `.env`.

The 2 MB bundle is almost entirely `mapbox-gl`; fine for a prototype, worth
code-splitting if this ever ships.
