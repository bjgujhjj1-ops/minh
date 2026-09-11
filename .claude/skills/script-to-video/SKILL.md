---
name: script-to-video
description: Turns a script + voiceover audio + a reference video style into a fully-edited Remotion video — segments the script into timestamped beats synced to the voiceover, finds matching free stock footage/photos for each beat (Pexels API by default, Pixabay/Mixkit/Coverr when Pexels lacks a good option), assembles everything into a new Remotion composition in my-video/ with title cards, captions, color grade, and transitions matching the reference style, and renders the final video. Use this whenever the user gives (or promises to give) a script and voiceover and wants a video made from it, asks to "edit a video from this script/voiceover", wants footage found and cut together for narration, or references a style video ("làm giống video này", "theo phong cách này") to build a new video around. Also trigger for follow-up requests to add/replace a segment's footage, change the style, or re-render an existing script-to-video composition.
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

## Work in batches, not one segment at a time

The user has flagged that this pipeline runs too slow — a 1-minute video
taking close to half an hour. Looking back at what actually burned the
time: searching, downloading, and verifying footage one segment at a time,
sequentially, with speculative extra downloads "just in case," and
background downloads left to hang with no timeout. None of that buys
accuracy — it's just unbatched work. Fix it structurally, not by cutting
corners:

- **Derive every segment's visual concept and search keywords in one pass**
  before searching anything, so Step 2 starts with a complete list rather
  than figuring out beat N+1 only after beat N is fully downloaded.
- **Fire off all the searches for all segments together** (multiple
  `pexels_search.py` calls, or multiple tool calls in the same turn) instead
  of one search → one download → one verify → next search. Tool calls that
  don't depend on each other's output belong in the same batch.
- **Pick one candidate per segment from the search results' metadata**
  (duration, description, resolution) before downloading anything — don't
  download three or four candidates per beat "to compare"; that's the
  cross-source-comparison habit the user already asked to drop, applied
  here to candidates within one source. Download the single best-looking
  match first; only fetch a second if the first fails the frame check.
- **Download the chosen clips in one batch**, not one `curl` per turn. Always
  pass `--max-time <n>` (e.g. 30-60s for a clip a few MB to a few dozen MB)
  so a stalled connection fails fast instead of hanging — this project once
  lost several minutes to a download that crept up 1MB at a time with no
  timeout, and separately to two overlapping background downloads racing to
  write the same file (never start a second download to a path a still-running
  one is writing to; if a download seems stuck, check `ps aux` for a stray
  process before assuming the network is just slow).
- **Extract preview frames for every downloaded candidate in one script
  call** (loop over all the files, as already shown in
  `references/footage-sourcing.md`), then review all of them in one pass
  — not one clip's frames, a judgment call, the next clip's frames, repeat.
- When something fails inspection, **re-fetch only that one segment's
  footage**, not the whole batch.

The accuracy-preserving checks stay exactly as they are (frame inspection
before committing, license checks for named subjects, still-render spot
checks before a full render) — this is about doing the same checks with
fewer round trips and less idle waiting, not skipping any of them.

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
line's meaning and the style's tone, and whether it needs a specific real
person/event or generic b-roll (see below — they come from different
places). Then follow `references/footage-sourcing.md` to search for
footage. For generic b-roll, default to Pexels (via
`scripts/pexels_search.py` and the API key in `my-video/.env`) — it's fast
and usually has something workable, so don't spend time cross-checking
other sites once it does. Reach for Pixabay, Mixkit, or Coverr only when
Pexels genuinely doesn't have a good option for a particular beat. For a
named, identifiable real person, historical figure, or specific event
(stock libraries don't carry these at all — searching them wastes a round
trip), go straight to Wikimedia Commons and other public-domain archives
per that file's "Named subjects" section, checking each image's actual
license rather than assuming. Download each asset into `my-video/public/`.
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

While going through the script's lines, flag ones with a number worth
emphasizing (a price, a date, a statistic), a name or title ("Salvator
Mundi" — "Đấng Cứu Thế"), or a quotable line — these get their own animated
call-out graphic timed to when they're spoken, per
`references/remotion-patterns.md` section 3a, not just left to the
voiceover alone. This is on by default, independent of whether the piece
also uses full-sentence captions (most scripts don't need those, per
section 3, but call-outs for the actually-important facts are worth doing
regardless). When a line cites a specific source (an article, a study),
show the actual source per section 3b, with a highlight sweep over the
cited phrase — a built citation card by default, a real Playwright
screenshot when that works out and matters for the piece. And when a
source image or screenshot doesn't natively fit the 16:9 frame, use the
blurred-fill technique in section 2a instead of cropping it or leaving
black bars.

The user has asked for animation to be used generously wherever it makes
the video better, not held back to the bare minimum — this applies to
every piece, not just footage. Title text, card/element entrances,
connecting lines or arrows, numbers or labels, transitions between
sections: animate them (fade + scale, slide, a drawn-in stroke, a staged
sequence of entrances) rather than having them snap into place statically.
`ConceptMapDemo.tsx` is a concrete example — the title eases in, each card
scales and fades in on its own beat, and the connecting arrows draw
themselves in with an animated stroke-dashoffset rather than appearing
instantly. Match the animation style to what fits the piece (a fast-cut
style wants snappier motion, a slow documentary wants gentler eases) but
default to adding motion, not skipping it.

That same reference file's section 7 has a fake-video-card hook + fast
multi-panel montage module, built for a specific clickbait-facts style seen
in one reference clip. It is opt-in, not a default: reach for it only when
the style the user actually asked to match calls for that exact curiosity-
hook structure. For anything else — a documentary, an explainer, a story —
building it in would be adding a style element nobody asked for.

Section 7a has a second module: flat-vector comparison/scale infographics
(a balance scale weighing two things against each other, a depth ruler with
a to-scale silhouette and labeled thresholds) — the Kurzgesagt-style
graphic explainer look. Unlike section 7, this one is **on by default,
mixed segment-by-segment into any video** per the user's direction: keep
footage/photos for narrative beats as usual, and switch just the specific
segment to this graphic treatment whenever a script line makes a comparison
or states a scale ("nặng bằng...", "sâu tới...", "to gấp..."), then return
to footage for the next beat. Flag these while deciding footage per segment
in Step 2, not as a whole-video style decision.

The user has explicitly asked that cuts not feel too fast or abrupt — do
not turn every `segment_script.py` line into its own cut by default. Read
`references/remotion-patterns.md` section 1a before deciding the shot list:
merge adjacent beats onto one held shot where they share an image, keep
individual shots around ~2.5-3s or longer, and use a longer crossfade
(~20-30 frames at 30fps). Only cut faster than that when the style
reference specifically calls for rapid-fire editing.

## Step 4 — Verify cheaply, then render

Run `npx remotion still <CompId> <out.png> --frame=<N>` at a few segment
boundaries — batch these as one shell loop over all the frame numbers you
want checked, not one `still` command per turn — this catches a bad import,
missing asset, or mistimed sequence in seconds. Only once those look right,
run `npx remotion render <CompId> <out.mp4>` for the full video. A full
render is the expensive step; don't reach it with an unverified composition,
but don't also re-render the same still twice while eyeballing it — read
the PNG once, decide, move on.

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
