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

## 7. Render pipeline

Before the full render, cheaply sanity-check with stills at a few segment
boundaries (`npx remotion still <CompId> out.png --frame=<N>`) — this catches
a broken import, a missing asset, or a badly-timed sequence in seconds
instead of waiting for a multi-minute full render to fail. Only run
`npx remotion render <CompId> out.mp4` once a couple of spot-checked stills
look right.
