# Road Trip Wrapped

A *Wrapped*-style recap of a road trip, prototyped as part of **Roadtrip Jam** —
a Google Maps concept for planning road trips with friends. After the trip,
Wrapped plays it back as a story: the stats, the stops, and the photos you
choose, ending in a shareable souvenir map of the route.

This is a standalone, mobile-web prototype of the Wrapped flow. It grew out of
the [main Roadtrip Jam prototype](https://github.com/rakshitk1210/roadtrip-jam-prototype)
(its trip map is still inside, under the You tab) but doesn't need to stay in
sync with it.

**Live demo:** https://road-trip-wrapped.vercel.app/

Designs: [Figma — Playground](https://www.figma.com/design/SkeL1hPeH14hgjr1h4akzz/Playground)

## Run it locally

```bash
npm install
npm run dev
```

Then open the address it prints (http://localhost:5173 by default).

The prototype is always laid out as a **402×874 iPhone 17** screen, scaled down
to fit smaller windows — it looks the same on a laptop as on a phone.

### Google Maps key (optional)

Only the live trip map (You → *Seattle to North Cascades*) needs one; the whole
Wrapped flow runs without it. Create `.env.local` in the project root:

```
VITE_GOOGLE_MAPS_KEY=your-key
```

The key needs **Maps JavaScript API**, **Places API (New)** and **Routes API**
enabled. `.env.local` is gitignored — never commit the key.

## The flow

1. **Explore** — the Maps home screen. Tap **Add to your Wrapped** on the card.
2. **Permissions** — *Personalize with Google Photos*, then the phone's own
   photo-access prompt. Allowing access starts the story; *Not now* or
   *Don't Allow* slides it away.
3. **The story** — *Hi, Rakshit*, then a frame per stat (distance, hours, miles,
   longest leg, unplanned stops). Tap the **right half** of the screen to move
   on, the **left half** to go back.
4. **Put your trip on the map** — the invite frame, over a blank dark-mode map.
5. **Choose your photos** — pick up to 10 from the trip's camera roll; each one
   lands on the map as you choose it.
6. **Here's where your photos landed** — a preview laid out exactly as the
   souvenir will be: each photo in its stop's spot beside the route. Tap **+**
   on a photo to attach a memory (an inside joke, what happened there).
7. **Choose a background** — the same map with a photo tray below; drag the
   tray's top bar up to see every photo.
8. **The souvenir** — the finished, shareable map: the route, every stop, and
   the trip's numbers.
9. **Back in the You tab** — your Wrapped photos appear as a grid. Tap one for
   its scrapbook page (date, place, the photo, and its memory if it has one);
   tap the sides to page through the rest.

**Shortcut:** press **P** anywhere to jump straight to *Put your trip on the map*.

## What's faked

- **The background choice is Wizard-of-Oz.** Whichever photo you pick, the
  souvenir uses the group shot at Diablo Lake.
- **Explore and You are screenshots** of Google Maps with live pieces on top —
  the sheet, the nav bar, the status bar. The sheet on Explore is locked so the
  screenshot's own sheet never shows.
- **Positions are hand-placed from Figma**, not computed from GPS: the route
  drawing, the stops and the photo spots all match the souvenir design.
- **Nothing is saved.** Picks, memories and the background choice reset on
  reload.
- The status bar reads **9:41** everywhere.

## Where things live

```
src/screens/
  ExploreScreen.tsx            Maps home + the Wrapped card
  PhotoPermissionScreen.tsx    Google Photos permission + iOS prompt
  WrappedFlow.tsx              the story's running order
  WrappedStartScreen.tsx       "Hi, Rakshit"
  WrappedFrameScreen.tsx       stat frames + the invite frame
  PhotoPickerScreen.tsx        choose your photos
  WrappedPreviewScreen.tsx     where your photos landed (+ memories)
  PhotoCommentScreen.tsx       writing a memory
  WrappedBackgroundScreen.tsx  choose a background
  TripDiorama.tsx              the route-and-photos map both screens share
  SouvenirMapScreen.tsx        the final souvenir
  YouScreen.tsx                You tab + Wrapped photo grid
  WrappedPhotoDetailScreen.tsx scrapbook page for one photo
src/data/
  wrappedFrames.ts             story frame copy and art
  curationPhotos.ts            the camera roll, its places, the souvenir photo
  souvenirMap.ts               souvenir stops, labels and stats
  wrappedRoute.ts              photo spots on the preview map
src/state/                     app state (tripContext.ts, tripStore.tsx)
src/styles/                    one stylesheet per area (wrapped, photoPicker,
                               wrappedPreview, souvenirMap, scrapbook, …)
public/assets/                 images exported from Figma
```

## Deploying

It's a static Vite app — on Vercel, import the repo and keep the detected
settings (`npm run build`, output `dist`). Add `VITE_GOOGLE_MAPS_KEY` under
**Settings → Environment Variables** if you want the trip map to work, and in
Google Cloud restrict the key to your site's address (*Websites:*
`your-project.vercel.app/*`) — it's visible in the page, so an unrestricted key
can be used by anyone.
