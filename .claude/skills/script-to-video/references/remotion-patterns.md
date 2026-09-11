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

## 8. Render pipeline

Before the full render, cheaply sanity-check with stills at a few segment
boundaries (`npx remotion still <CompId> out.png --frame=<N>`) — this catches
a broken import, a missing asset, or a badly-timed sequence in seconds
instead of waiting for a multi-minute full render to fail. Only run
`npx remotion render <CompId> out.mp4` once a couple of spot-checked stills
look right.
