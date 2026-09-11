---
name: script-to-video
description: Turns a script + voiceover audio + a reference video style into a fully-edited Remotion video — segments the script into timestamped beats synced to the voiceover, finds matching free stock footage/photos for each beat across multiple free sources (Pexels, Pixabay, Mixkit, Coverr), assembles everything into a new Remotion composition in my-video/ with title cards, captions, color grade, and transitions matching the reference style, and renders the final video. Use this whenever the user gives (or promises to give) a script and voiceover and wants a video made from it, asks to "edit a video from this script/voiceover", wants footage found and cut together for narration, or references a style video ("làm giống video này", "theo phong cách này") to build a new video around. Also trigger for follow-up requests to add/replace a segment's footage, change the style, or re-render an existing script-to-video composition.
---

# Script → Voiceover → Remotion video

This skill packages the workflow already used in this project (see
`my-video/src/PexelsOceanEdit.tsx`) into a repeatable pipeline: given a
script, a voiceover, and a style to match, produce a finished Remotion
composition with the right footage in the right place at the right time.

Three inputs drive every run. Don't start building until you have (or have
reasonably inferred) all three — building the wrong style or mistiming the
cuts wastes a full render cycle:

1. **Style reference** — a description, a link to an example video, or
   "match `PexelsOceanEdit.tsx`". If given a video link you can't actually
   watch (e.g. a YouTube URL — there's no video-viewing tool available,
   only page text via `WebFetch`), say so plainly and ask the user to
   describe the specific elements that matter: pacing/cut speed, caption
   style, color mood, aspect ratio (16:9 vs 9:16 for Shorts/Reels), music
   or sound design expectations. Don't silently guess a whole aesthetic from
   a title alone.
2. **Script** — the narration text, ideally already split into the beats
   the user wants cut on (one line per visual idea). If it's one big block
   of prose, ask whether to auto-split by sentence or whether they have
   beats in mind — the cut points are a creative decision.
3. **Voiceover audio** — the actual narration recording. If it doesn't
   exist yet, you can still do the footage research and draft the
   composition with estimated timing, but flag clearly that final timing
   needs a real render once the audio arrives, since word-count-based
   pacing (see step 2 below) is an approximation.

## Step 1 — Segment the script into timestamps

Get the voiceover's duration first. Try `ffprobe -v error -show_entries
format=duration -of default=noprint_wrappers=1:nokey=1 <file>` if it's
installed; this sandbox often lacks ffmpeg, so fall back to
`scripts/get_media_duration.py <file>` (handles .wav exactly, .mp4/.m4a
exactly, .mp3 approximately).

Then run `scripts/segment_script.py`:
- If you have a timed transcript (`.srt`/`.vtt` from a TTS tool or a
  transcription pass) use `--srt` — this reflects real speech pacing and
  should always be preferred when available.
- Otherwise use `--text <script.txt> --duration <seconds> --fps <fps>` for a
  word-count-proportional split. Treat this as a first draft: real narration
  doesn't move at a constant rate, so after the composition is assembled,
  listen against the render and nudge segment boundaries that feel off
  rather than trusting the estimate blindly.

This gives you a JSON list of `{index, start_frame, end_frame, text}` — the
spine the rest of the pipeline hangs off of.

## Step 2 — Find footage for each segment

For every segment, read the text and decide what it should look like on
screen — not a literal keyword match, but the visual that best serves the
line's meaning and the style's tone. Then follow
`references/footage-sourcing.md` to search for footage. Pexels (via
`scripts/pexels_search.py` and the API key in `my-video/.env`) is the
fastest option, but check Pixabay, Mixkit, and Coverr too rather than
settling for a mediocre Pexels match when one of them has something
better — the user has explicitly asked for this, it isn't just a fallback
for when Pexels comes up empty. Download each asset into `my-video/public/`.
That reference file also covers picking video vs. still, handling abstract
lines with no literal visual, avoiding repetitive shots, and — importantly
— actually looking at extracted frames before committing to a clip rather
than trusting a search result's title (a past run picked footage described
as generic countryside and coastline that turned out to have modern cars
and resort buildings in frame, breaking a period piece).

Keep a clear record of which downloaded file belongs to which segment index
— you'll need it in the next step, and it's easy to lose track past a
handful of segments.

## Step 3 — Build the Remotion composition

Read `references/remotion-patterns.md` for the concrete structure: how to
lay segments out as overlapping `<Sequence>`s, the reusable footage-clip
component (fade + Ken Burns + color grade), captions, the single
project-wide `<Audio>` for the voiceover, and how the existing title-card /
lower-third / letterbox-bar / vignette pieces from `PexelsOceanEdit.tsx`
carry over. Create a new `.tsx` file under `my-video/src/`, apply the
reference style's specific look (colors, fonts, caption placement, cut
speed) rather than copying the ocean-edit look verbatim, and register a new
`<Composition>` in `my-video/src/Root.tsx` with a duration computed from the
segment data — not hand-counted.

The user has explicitly asked that cuts not feel too fast or abrupt — do
not turn every `segment_script.py` line into its own cut by default. Read
`references/remotion-patterns.md` section 1a before deciding the shot list:
merge adjacent beats onto one held shot where they share an image, keep
individual shots around ~2.5-3s or longer, and use a longer crossfade
(~20-30 frames at 30fps). Only cut faster than that when the style
reference specifically calls for rapid-fire editing.

## Step 4 — Verify cheaply, then render

Run `npx remotion still <CompId> <out.png> --frame=<N>` at a few segment
boundaries first — this catches a bad import, missing asset, or mistimed
sequence in seconds. Only once those look right, run `npx remotion render
<CompId> <out.mp4>` for the full video. A full render is the expensive step;
don't reach it with an unverified composition.

Send the rendered video to the user. If something needs to change (a wrong
clip, mistimed cut, wrong color mood), figure out which step it traces back
to — a bad footage choice is a Step 2 fix, a mistimed cut is a Step 1
timing fix or a `CROSSFADE`/duration tweak in Step 3 — rather than
re-deriving everything from scratch.

## Notes on repeated invocations

Each new script/voiceover/style is a fresh run of this pipeline — segment
count, footage, and the composition file are specific to that piece. What
carries over between runs is the *structure* in `references/`, not any
particular segment's content. If the user asks to reuse the same style
across multiple scripts, keep the color grade, caption treatment, and title
card design consistent across the resulting compositions rather than
re-deriving the look each time.
