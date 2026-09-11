# Remotion patterns used in this project

Two existing compositions already establish the house style for this
project — read them before writing new code, don't reinvent these from
scratch:

- `my-video/src/EditedTrailer.tsx` — trimmed video, title card, lower-third,
  letterbox bars, vignette, color-grade filter, audio fade.
- `my-video/src/PexelsOceanEdit.tsx` — the same patterns applied to a
  Pexels-sourced clip; the most direct template for a single-clip edit.

Below are the reusable pieces, generalized for a *multi-segment* edit driven
by a script + voiceover (which neither existing file does yet — they're each
a single clip). Adapt the specific numbers (colors, fonts, timing) to
whatever style the user asked you to learn; the *structure* is what to reuse.

## 1. Composition shape: one `<Sequence>` per segment, crossfading

Each segment gets a `<Sequence>` positioned at a cumulative frame offset,
overlapping the previous one by `CROSSFADE` frames so cuts dissolve instead
of hard-cutting (unless the style you're matching calls for hard cuts — some
fast-paced styles do; in that case, drop the overlap and the opacity fade-in
at the top of the clip, keep everything else):

```tsx
const CROSSFADE = 15; // frames of overlap between segments; 0 for hard cuts

function computeSegmentOffsets(segments: {durationInFrames: number}[]) {
  let cursor = 0;
  return segments.map((seg) => {
    const from = cursor;
    cursor += seg.durationInFrames - CROSSFADE;
    return from;
  });
}
```

Render with:

```tsx
{segments.map((seg, i) => (
  <Sequence key={i} from={offsets[i]} durationInFrames={seg.durationInFrames}>
    <FootageClip {...seg} />
  </Sequence>
))}
```

## 1a. Pacing: don't cut on every script line

`segment_script.py` gives you one timestamp range per script line, but that
is not the same thing as one shot per line — the user has explicitly asked
for cuts that aren't too fast or abrupt, and a line-for-line cut rate reads
as frantic once footage is playing under narration (confirmed on the first
`RiseOfRome` draft: 6 shots across 13s of voiceover, several under a second
long, felt rushed).

Treat the segment list as raw material for editorial decisions, not a cut
list to execute literally:

- **Merge adjacent segments onto one held shot** when they're part of the
  same beat or image (e.g. "a small village by the river" + "and from those
  huts, something rose" can both play over one continuous village shot).
  A good rough floor is **~2.5-3 seconds per shot** unless the style
  reference specifically calls for rapid-fire cutting (some do — trust the
  style analysis over this default).
- **Lengthen the crossfade** for a calmer feel — 20-30 frames (~0.7-1s) at
  30fps reads as a deliberate dissolve; under ~15 frames starts to feel like
  a flicker between shots rather than a transition.
- When in doubt, cut *less* than the script's line count suggests. It's
  easy to add a cut back in if a hold drags; it's a full re-render to fix a
  video that feels edited with a machine gun.

## 2. A single footage clip: fade in/out + Ken Burns + color grade

This is the core reusable unit — video and still images both go through
this shape, just swapping `OffthreadVideo` for `Img`:

```tsx
const FootageClip: React.FC<SegmentProps> = ({src, isVideo, durationInFrames, kenBurnsDirection}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, CROSSFADE, durationInFrames - CROSSFADE, durationInFrames],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );
  // Ken Burns: slow zoom, direction varied per segment so it doesn't feel repetitive
  const scale = interpolate(frame, [0, durationInFrames], kenBurnsDirection === "in" ? [1, 1.1] : [1.1, 1]);

  const Media = isVideo ? OffthreadVideo : Img;
  return (
    <AbsoluteFill style={{opacity}}>
      <AbsoluteFill style={{transform: `scale(${scale})`}}>
        <Media
          src={src}
          style={{width: "100%", height: "100%", objectFit: "cover", filter: COLOR_GRADE_FILTER}}
        />
      </AbsoluteFill>
      {/* vignette, letterbox bars, captions go here — see below */}
    </AbsoluteFill>
  );
};
```

`COLOR_GRADE_FILTER` is a CSS `filter` string, e.g.
`"contrast(1.1) saturate(1.3) brightness(1.02)"` — this is the single knob
that gives the whole edit a consistent look across footage from different
sources; tune it once from the style reference and reuse it on every
segment rather than grading each clip separately.

## 2a. When an image doesn't fill the 16:9 frame: blurred fill, not black bars

`objectFit: "cover"` (what `FootageClip` uses above) always fills the frame
but crops the source — fine for most footage, wrong for a source where
cropping loses the point (a full document, a portrait that must stay whole,
a screenshot). Per the user's example: a photo that's the wrong aspect
ratio for 16:9 shouldn't get black bars either (`objectFit: "contain"`
alone looks unfinished) — fill the empty space with the same image, blurred
and scaled up, behind the sharp full image:

```tsx
const BlurredFillMedia: React.FC<{ src: string; isVideo?: boolean }> = ({ src, isVideo }) => {
  const Media = isVideo ? OffthreadVideo : Img;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ filter: "blur(50px) brightness(0.55)", transform: "scale(1.3)" }}>
        <Media src={src} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
        <Media
          src={src}
          style={{ maxWidth: "92%", maxHeight: "92%", objectFit: "contain", boxShadow: "0 25px 60px rgba(0,0,0,0.6)" }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
```

The `scale(1.3)` on the blurred layer matters — without it, `blur()` softens
the image's own edges into visible dark fringes at the frame border; scaling
past 100% pushes those edges outside the visible area. Reach for this
whenever the source's own composition (a full portrait, a full page, a
screenshot) needs to stay intact rather than being cropped by `cover`.

## 3. Captions synced to the script

Since you already have each segment's text and frame range from
`segment_script.py`, burn the line in as an on-screen caption (if the style
calls for captions — some styles are voiceover-only with no text):

```tsx
const Caption: React.FC<{text: string}> = ({text}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 8], [0, 1], {extrapolateRight: "clamp"});
  return (
    <div style={{position: "absolute", bottom: 80, width: "100%", textAlign: "center", opacity}}>
      <span style={{background: "rgba(0,0,0,0.55)", padding: "10px 24px", borderRadius: 8, color: "white", fontSize: 34}}>
        {text}
      </span>
    </div>
  );
};
```

Match the font, position, and background treatment to the style reference —
this snippet is a structural starting point, not a fixed look.

## 3a. Call-out text for key numbers, names, and quotes

Per the user's direction: this is separate from (and usually more useful
than) full-sentence captions. Whenever a line says a number that matters
(a price, a date, a statistic), a title or proper name worth emphasizing
("Salvator Mundi" — "Đấng Cứu Thế"), or a quotable line, put it on screen as
its own animated graphic timed to when it's spoken — not as a caption of
the whole sentence, but as a highlighted call-out of just that fact. This
reads as a deliberate editorial choice (the kind you see in real
documentary/explainer videos) rather than a transcript running underneath.
`DaVinciSalvatorMundi.tsx`'s `ClosingQuote` component is one example
(a full quote, bottom-anchored, fading and sliding in); a number or short
title works the same way but usually reads better placed and sized like a
stat card rather than a caption bar:

```tsx
const CalloutNumber: React.FC<{ value: string; label: string; startAt: number }> = ({ value, label, startAt }) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  if (local < 0) return null;
  const opacity = interpolate(local, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(local, [0, 20], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", bottom: 140, left: 100, opacity, transform: `scale(${scale})` }}>
      <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 800, fontSize: 64, color: "white" }}>{value}</div>
      <div style={{ fontFamily: "Arial, sans-serif", fontSize: 22, color: "#c9c9c9", letterSpacing: 2 }}>{label}</div>
    </div>
  );
};
```

Go through the script line by line while planning Step 3 and flag which
segments have a number, name, or line worth calling out this way — most
scripts have several. Don't call out every noun; reserve it for the facts
that are actually the point of the sentence (a record price, the name of
the artwork, a date that anchors the story) so each one still lands as an
emphasis rather than becoming visual noise.

## 3b. "Here's the source" — citing an article with a highlight sweep

Per the user's direction: when a line cites a specific source (Wikipedia,
a news article, a study), show the actual source on screen rather than
just stating the fact in narration — it reads as credible evidence, not
just a claim, and is exactly the technique fact-based YouTube channels use.

**Getting the source image, in order of preference:**
1. A real screenshot of the page, via Playwright (`pip install playwright`,
   then `playwright install` — or if that reports a version mismatch
   against the sandbox's pre-installed browser, launch with
   `executable_path` pointing at whatever's under `/opt/pw-browsers/`
   directly). Try `browser.new_page().goto(url)` then `.screenshot(path=...)`.
   **This can fail in this sandbox** — a full browser session tunneled
   through the agent proxy has been observed to get its connection reset
   even with the proxy correctly configured (`proxy={"server": os.environ["HTTPS_PROXY"]}`),
   while plain `curl`/`WebFetch` to the same host work fine. If it fails
   after one retry, don't burn more time on it — fall back to option 2.
2. **A built, styled citation card** — not a literal screenshot, but a
   component that reads as one: source name, a short quoted excerpt (pulled
   via `WebFetch`), and a URL, laid out like a browser or article card. This
   is the reliable default — no browser automation to fail, and you control
   the layout completely:

```tsx
const SourceCitation: React.FC<{ source: string; excerpt: string; url: string; highlightAt: number }> = ({
  source, excerpt, url, highlightAt,
}) => {
  const frame = useCurrentFrame();
  const local = frame - highlightAt;
  const sweep = interpolate(local, [0, 25], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", background: "rgba(0,0,0,0.75)" }}>
      <div style={{ width: 900, background: "white", borderRadius: 12, padding: 40, boxShadow: "0 30px 80px rgba(0,0,0,0.6)" }}>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 16, color: "#888", marginBottom: 12 }}>{source} · {url}</div>
        <div style={{ fontFamily: "Georgia, serif", fontSize: 26, lineHeight: 1.5, color: "#111", position: "relative" }}>
          <span style={{ background: `linear-gradient(90deg, #ffe066 ${sweep}%, transparent ${sweep}%)` }}>{excerpt}</span>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

3. If a real screenshot is genuinely important for a specific piece (the
   user wants the literal page, not a recreation), ask the user to supply
   it — they clearly can (both example images in this conversation were
   screenshots they took themselves).

**The highlight itself**, once you have an image either way: a colored box
or gradient sweeping across the exact phrase being cited, timed to when the
voiceover says it (the `sweep`/`linear-gradient` approach above works over
real text; over a flat screenshot image, use a positioned semi-transparent
rectangle instead, sized to the phrase's pixel location in that specific
screenshot — read the image first to find those coordinates, they're not
computable from text). Keep the highlight color true to a highlighter
(yellow, ~40-50% opacity, `mix-blend-mode: multiply` reads more like ink
than a flat overlay) and don't leave it up for the entire shot — sweep in
around when the fact is spoken, hold briefly, let it ride with the rest of
the shot's fade-out.

## 4. Voiceover audio

Add one `<Audio>` spanning the whole composition (not per-segment) so it
never restarts or clips at segment boundaries:

```tsx
import { Audio, staticFile } from "remotion";

<Audio src={staticFile("voiceover.mp3")} />
```

If the style wants the voiceover to duck under ambient/music beds from the
footage's original audio, mute the footage clips' own audio
(`OffthreadVideo` `muted` prop) rather than trying to balance two audio
tracks — cleaner and avoids the source clips' incidental noise fighting the
narration.

## 5. Title card / intro, lower-thirds, letterbox bars, vignette

Copy these near-verbatim from `PexelsOceanEdit.tsx` (`TitleCard`,
`LowerThird`, the two `BAR_HEIGHT` divs, and the `radial-gradient` vignette
`AbsoluteFill`) — they're style elements independent of which footage is
playing underneath, so they don't need to be redesigned per project, just
re-themed (colors, fonts, copy) to match what the user asked for.

## 6. Registering the composition

Add one `Composition` per completed piece to `my-video/src/Root.tsx`,
importing its duration constant the same way `EDITED_TRAILER_DURATION` and
`PEXELS_OCEAN_EDIT_DURATION` are — computed from the segment math, not
hand-counted, so it stays correct if segments change.

## 7. Optional module: the "viral documentary" hook

One style reference for this project (a faceless nature-facts channel,
analyzed frame-by-frame from an uploaded clip — no video-viewing tool
exists here, so this came from extracting and looking at still frames, not
watching it) opens with two elements neither `RiseOfRome` nor `NZJackfruit`
use yet. Reach for these specifically when a style reference calls for a
punchy, curiosity-hook YouTube-facts opening — not the default for every
video, and not what a documentary or a lighthearted explainer piece
(this project's other two pieces) should use.

### 8a. Fake video-card hook

A mocked-up YouTube video card (thumbnail + title + metadata), tilted and
floating on a plain background, straightening out over the first ~2s:

```tsx
const ThumbnailHookCard: React.FC<{title: string; accentWord: string; duration: string; views: string}> = (
  {title, accentWord, duration, views},
) => {
  const frame = useCurrentFrame();
  const rotation = interpolate(frame, [0, 45], [8, 0], {extrapolateRight: "clamp", easing: Easing.out(Easing.cubic)});
  const scale = interpolate(frame, [0, 45], [0.85, 1], {extrapolateRight: "clamp"});

  return (
    <AbsoluteFill style={{backgroundColor: "#2b2620", justifyContent: "center", alignItems: "center"}}>
      <div style={{transform: `rotate(${rotation}deg) scale(${scale})`, width: 640, borderRadius: 20, background: "white", boxShadow: "0 30px 60px rgba(0,0,0,0.5)", overflow: "hidden"}}>
        <div style={{position: "relative", aspectRatio: "16/9", background: "linear-gradient(160deg, #0a3d2e, #041a12)"}}>
          {/* thumbnail image/video would go here as a background-fill Img/OffthreadVideo */}
          <div style={{position: "absolute", left: 24, bottom: 24, fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 40, lineHeight: 1.05, color: "white", textTransform: "uppercase"}}>
            {title} <span style={{color: "#e53935"}}>{accentWord}</span>
          </div>
          <div style={{position: "absolute", right: 16, bottom: 16, background: "rgba(0,0,0,0.75)", color: "white", fontSize: 18, padding: "3px 8px", borderRadius: 4}}>{duration}</div>
          <div style={{position: "absolute", left: 0, bottom: 0, height: 4, width: "35%", background: "#e53935"}} />
        </div>
        <div style={{padding: "14px 20px", fontFamily: "Arial, sans-serif", color: "#111"}}>
          <div style={{fontWeight: 700, fontSize: 20}}>{title} {accentWord}</div>
          <div style={{color: "#666", fontSize: 15, marginTop: 4}}>{views}</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
```

Numbers here are a starting point copied from the analyzed reference, not
gospel — retheme colors/fonts to the current project, and drop the
metadata row entirely if the style reference didn't have one.

### 8b. Multi-panel fast montage

Several clips playing at once in vertical strips, each cutting
independently and faster than the main edit's pace — used right after the
hook to build curiosity before settling into the real footage:

```tsx
const MontagePanel: React.FC<{clips: string[]; panelDurationInFrames: number}> = ({clips, panelDurationInFrames}) => {
  const frame = useCurrentFrame();
  const clipIndex = Math.floor(frame / panelDurationInFrames) % clips.length;
  const localFrame = frame % panelDurationInFrames;
  return (
    <AbsoluteFill>
      <OffthreadVideo
        src={staticFile(clips[clipIndex])}
        startFrom={0}
        muted
        style={{width: "100%", height: "100%", objectFit: "cover", filter: COLOR_GRADE_FILTER}}
      />
    </AbsoluteFill>
  );
};

const MultiPanelMontage: React.FC<{panels: string[][]; panelDurationInFrames: number}> = ({panels, panelDurationInFrames}) => (
  <AbsoluteFill style={{flexDirection: "row"}}>
    {panels.map((clips, i) => (
      <div key={i} style={{flex: 1, position: "relative", overflow: "hidden"}}>
        <MontagePanel clips={clips} panelDurationInFrames={panelDurationInFrames} />
      </div>
    ))}
  </AbsoluteFill>
);
```

3-4 panels, each cycling through 2-3 short clips every ~15-20 frames
(~0.5-0.7s at 30fps), reproduces the dense parallel-cutting feel from the
reference. This needs several short clips per panel rather than one — plan
footage sourcing accordingly if a style calls for this (more downloads than
a normal segment-per-shot edit).

## 7a. Optional module: comparison / scale infographics

From the user's examples: a balance scale weighing a pile of cars against a
whale, and a depth ruler showing how far underwater a whale dives with
labeled thresholds. This is the flat-vector infographic style used across
science/nature explainer channels (Kurzgesagt and similar) for "how big /
how heavy / how deep is X" beats — draw it with plain SVG, no footage or
icon library needed (avoids any licensing question entirely: hand-drawn
silhouettes are yours).

Unlike section 7's hook module (an all-or-nothing style choice for the
whole piece), this one is meant to be **mixed into any video by default**,
per the user's direction: real footage/photos carry the narrative and
descriptive beats as usual, and whenever a script line makes a comparison
or states a scale ("bằng trọng lượng của...", "sâu tới...", "to gấp..."),
that specific segment switches to this graphic treatment, then the next
segment goes back to footage. This is exactly how real documentary/science
channels cut between live footage and infographic explainers — don't treat
switching to SVG graphics mid-video as a style clash; it's a deliberate,
expected beat, not a compromise. Flag these beats during Step 2 alongside
the other segment-by-segment decisions (footage vs. still, call-out or
not) rather than deciding it up front as a whole-video style choice.

### Balance scale (weight/quantity comparison)

A beam rotating around a fixed pivot, with a "pan" of repeated icons on
each side. Keep the pans level (counter-rotate against the beam) while the
beam itself tilts toward whichever side should read as heavier:

```tsx
const CarIcon: React.FC<{ x: number; y: number; scale?: number }> = ({ x, y, scale = 1 }) => (
  <g transform={`translate(${x}, ${y}) scale(${scale})`} fill="#9a9a9a">
    <path d="M2,14 L4,14 L7,9 L12,9 L14,6 L24,6 L26,9 L31,9 L33,14 L35,14 L35,17 L2,17 Z" />
    <circle cx="9" cy="17" r="3" fill="#333" />
    <circle cx="28" cy="17" r="3" fill="#333" />
  </g>
);

const WhaleIcon: React.FC<{ x: number; y: number; scale?: number; rotation?: number }> = ({ x, y, scale = 1, rotation = 0 }) => (
  <g transform={`translate(${x}, ${y}) rotate(${rotation}) scale(${scale})`} fill="#8a8a8a">
    <path d="M0,20 Q25,2 65,8 Q95,11 108,20 Q96,15 80,19 L72,32 L64,20 Q30,27 0,20 Z" />
  </g>
);

const BalanceScale: React.FC<{ tiltDegrees: number; pyramidRows: number }> = ({ tiltDegrees, pyramidRows }) => {
  const beamHalfWidth = 260;
  return (
    <svg viewBox="0 0 1000 500" style={{ width: "100%", height: "100%" }}>
      {/* stand */}
      <rect x="490" y="260" width="20" height="200" fill="white" />
      <polygon points="470,460 530,460 545,500 455,500" fill="white" />
      {/* beam, pivoting at (500, 260) */}
      <g transform={`rotate(${tiltDegrees}, 500, 260)`}>
        <line x1={500 - beamHalfWidth} y1="260" x2={500 + beamHalfWidth} y2="260" stroke="white" strokeWidth={4} />
        {/* left pan: counter-rotate to stay level, holds the car pyramid */}
        <g transform={`translate(${500 - beamHalfWidth}, 260) rotate(${-tiltDegrees})`}>
          <ellipse cx="0" cy="30" rx="90" ry="14" fill="white" />
          {Array.from({ length: pyramidRows }).map((_, row) =>
            Array.from({ length: pyramidRows - row }).map((_, col) => (
              <CarIcon
                key={`${row}-${col}`}
                x={-((pyramidRows - row) * 20) + col * 40 - 18}
                y={10 - row * 16}
                scale={0.9}
              />
            )),
          )}
        </g>
        {/* right pan: counter-rotate to stay level, holds the whale */}
        <g transform={`translate(${500 + beamHalfWidth}, 260) rotate(${-tiltDegrees})`}>
          <ellipse cx="0" cy="30" rx="90" ry="14" fill="white" />
          <WhaleIcon x={-55} y={-5} scale={1} />
        </g>
      </g>
    </svg>
  );
};
```

Drive `tiltDegrees` with `interpolate(frame, [0, 40], [0, targetTilt])` so it
settles into position rather than snapping there — a small overshoot-and-
settle (interpolate through a couple of extra keyframes past the target and
back) reads as physical weight, a straight linear tilt reads flat. Treat
the exact path coordinates above as a rough starting silhouette, not a
final asset — render a still and look at it (same as any other visual
decision in this pipeline), then adjust the path points until the shape
reads clearly at the size it'll actually appear on screen.

### Depth / scale ruler

A vertical ruler with tick marks, an ocean gradient background, and a
to-scale silhouette descending past labeled depth thresholds that fade in
as they're reached:

```tsx
const DepthRuler: React.FC<{ diveProgress: number; thresholds: { depth: string; atProgress: number }[] }> = ({
  diveProgress,
  thresholds,
}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <svg viewBox="0 0 1920 1080" style={{ width: "100%", height: "100%" }}>
        <defs>
          <linearGradient id="ocean" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a5f7a" />
            <stop offset="100%" stopColor="#062338" />
          </linearGradient>
        </defs>
        <rect width="1920" height="1080" fill="url(#ocean)" />
        {/* ruler ticks along the left edge */}
        {Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={60} y={i * 80} width={40} height={4} fill="white" opacity={0.8} />
        ))}
        {/* descending silhouette, position driven by diveProgress (0-1) */}
        <g transform={`translate(300, ${diveProgress * 900}) rotate(90)`}>
          <WhaleIcon x={0} y={0} scale={1.6} />
        </g>
        {/* depth labels, each fading in once the dive reaches its threshold */}
        {thresholds.map((t, i) => {
          const opacity = interpolate(frame, [0, 1], [diveProgress >= t.atProgress ? 1 : 0, diveProgress >= t.atProgress ? 1 : 0]);
          return (
            <text key={i} x={1300} y={150 + i * 260} fill="white" fontSize={56} fontWeight={800} opacity={opacity}>
              {t.depth}
            </text>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
```

(The label-opacity line above is written as a same-frame step for clarity —
in practice, drive it with a proper `interpolate(frame, [thresholdFrame,
thresholdFrame + 15], [0, 1], {extrapolateLeft: "clamp"})` per label using
each threshold's actual frame number, the same fade-in approach used
everywhere else in this file.) Compute `diveProgress` from the segment's own
frame range so the silhouette's descent is paced to the voiceover rather
than running on a fixed clock independent of what's being said.

## 8. Render pipeline

Before the full render, cheaply sanity-check with stills at a few segment
boundaries (`npx remotion still <CompId> out.png --frame=<N>`) — this catches
a broken import, a missing asset, or a badly-timed sequence in seconds
instead of waiting for a multi-minute full render to fail. Only run
`npx remotion render <CompId> out.mp4` once a couple of spot-checked stills
look right.
