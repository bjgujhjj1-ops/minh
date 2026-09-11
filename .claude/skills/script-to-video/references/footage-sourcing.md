# Sourcing free footage from Pexels (and Pixabay as fallback)

No Pexels/Pixabay API key is configured in this environment, so don't reach
for their REST APIs — you'd need a key you don't have. Instead, use the two
web tools you already have (`WebSearch`, `WebFetch`) to browse the site like
a person would and pull the direct file URL off the page. This has already
been proven out in this project (see `my-video/public/ocean-waves.mp4`,
sourced from pexels.com/video/ocean-waves-856204).

## The method, per segment

For each script segment, you already derived 2-4 visual keywords from the
line's meaning (not literal word-matching — "a new day begins with hope"
suggests sunrise/dawn light, not literally searching for "hope"). Use those
keywords:

1. **Search.** `WebSearch` with `site:pexels.com <keywords>`. Add "video" or
   restrict nothing if a photo would do — check whether the segment calls for
   motion footage or a still image based on the style you're following.
   If results are thin or off-topic, broaden or swap the keywords rather than
   settling for a poor match — a mismatched clip is more noticeable to a
   viewer than a slightly-generic one.
2. **Resolve the direct file URL.** `WebFetch` the chosen `pexels.com/video/...`
   or `pexels.com/photo/...` page with a prompt like "Find the direct
   downloadable file URL (videos.pexels.com/video-files/... or
   images.pexels.com/photos/...), the author name, and license." Pexels
   content is royalty-free (their license permits free use, modification, no
   attribution required) but crediting the author in a lower-third or credits
   card is good practice and costs nothing.
3. **Fallback to Pixabay.** If Pexels has nothing suitable, repeat the same
   two steps with `site:pixabay.com` — same CC0-style free-use terms, same
   "search then resolve the direct file URL from the page" method.
4. **Download.** `curl -sSL -o my-video/public/<descriptive-name>.mp4
   "<direct-url>"` — always save into the Remotion project's `public/`
   folder, since that's the only place `staticFile()` can resolve from.
   Verify the download actually succeeded before moving on: check the HTTP
   status curl reports and that `file <path>` recognizes it as video/image
   data, not an HTML error page saved with a misleading extension.
5. **Check the duration** (for video clips) with `scripts/get_media_duration.py`
   if `ffprobe` isn't on the system — you need this to know how much of the
   clip you can safely use for the segment's `VIDEO_DURATION` before it runs
   out or starts looping into unrelated footage. Prefer plain `ffprobe` first
   (`ffprobe -v error -show_entries format=duration ...`) if it happens to be
   installed; only fall back to the bundled script if it's missing.

## Naming and mapping

Keep a clear mapping from segment index to downloaded filename (e.g.
`segment-00-ocean-sunrise.mp4`, `segment-01-city-morning.jpg`) — it's easy to
lose track of which file goes with which line once you've downloaded footage
for eight or ten segments. Whatever structure you use to pass segment data
into the Remotion composition (a TS object, a JSON file imported at build
time), include the source URL and author as a comment or field next to each
asset so credits can be generated later without re-searching.

## Judgment calls

- If a segment is abstract or has no obvious literal visual (e.g. "and then
  everything changed"), fall back to something tonally consistent — a
  slow-motion detail shot, a lighting change, a transition-style clip —
  rather than forcing a literal but awkward match.
- Prefer clips a few seconds longer than the segment needs, so you have room
  to choose the best-looking `startFrom` offset rather than being stuck with
  the clip's first frames (which are sometimes a fade-in or a less
  interesting part of the shot).
- If the same broad topic recurs across segments (e.g. multiple "ocean"
  beats), don't reuse the exact same clip back to back — vary the shot
  (different angle, time of day, or a still photo instead of video) so the
  edit doesn't feel repetitive.
