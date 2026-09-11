# Sourcing free footage from Pexels (and Pixabay as fallback)

## Preferred method: the Pexels API

A Pexels API key is stored in `my-video/.env` as `PEXELS_API_KEY` (gitignored
— never copy it into a committed file, a script, or a chat reply). Use
`scripts/pexels_search.py`, which calls the real API and hands back direct,
already-resolved file URLs — no more guessing filenames off the HTML page:

```
python3 .claude/skills/script-to-video/scripts/pexels_search.py videos "ancient roman ruins aerial" --per-page 5 --orientation landscape
python3 .claude/skills/script-to-video/scripts/pexels_search.py photos "misty mountain valley" --per-page 5
```

Each result's `files` (videos) or `src` (photos) list is pre-sorted so the
first entry is the best fit for a 1080p edit (largest file that doesn't
exceed ~1920px wide) — grab that one unless the project specifically needs
4K. The script reads the key from `PEXELS_API_KEY` in the environment or
from `my-video/.env` automatically, so no flag is needed in the common case.

Note: Pexels sits behind Cloudflare, which blocks generic HTTP client user
agents outright — the script already sends a browser-like User-Agent for
this reason. If you ever hit an HTTP 403 with `error code: 1010` calling the
API directly (e.g. via a one-off curl), add a real User-Agent header rather
than assuming the key is invalid.

## Fallback: no API key available

If `my-video/.env` has no key and the user hasn't provided one, fall back to
browsing the site like a person would with `WebSearch` and `WebFetch`:

1. **Search.** `WebSearch` with `site:pexels.com <keywords>`.
2. **Resolve the direct file URL.** `WebFetch` the chosen `pexels.com/video/...`
   or `pexels.com/photo/...` page with a prompt like "Find the direct
   downloadable file URL (videos.pexels.com/video-files/... or
   images.pexels.com/photos/...), the author name, and license." This is
   slower and less reliable than the API (the fetch summary sometimes
   guesses at a filename pattern instead of quoting the real one — verify
   by checking the downloaded file, per step below) but works with zero
   setup. This project's first Pexels edit (`my-video/public/ocean-waves.mp4`,
   from pexels.com/video/ocean-waves-856204) was sourced this way.
3. **Fallback to Pixabay.** If Pexels has nothing suitable, repeat with
   `site:pixabay.com` — same CC0-style free-use terms, same method (or check
   whether Pixabay also has an API key available before scraping it).

## Downloading and verifying (both methods)

1. **Download.** `curl -sSL -o my-video/public/<descriptive-name>.mp4
   "<direct-url>"` — always into the Remotion project's `public/` folder,
   since that's the only place `staticFile()` can resolve from. Check the
   HTTP status curl reports and run `file <path>` to confirm it's actually
   video/image data, not an HTML error page saved with a misleading
   extension.
2. **Look at the actual footage before committing to it.** A search result's
   title and description are not enough — extract a few frames (`opencv-python`
   works if installed: `cv2.VideoCapture` + `.set(cv2.CAP_PROP_POS_FRAMES, ...)`
   + `.read()`, or `ffmpeg -ss <t> -i <file> -frames:v 1 out.jpg` if ffmpeg is
   available) and actually view them with the Read tool. This caught a real
   mistake on this project's first multi-segment edit: search results
   described several clips as generic "river village" and "Mediterranean
   coast" footage, but the actual frames showed a **present-day** village
   (modern roofs, parked cars) and a modern resort town (cars, hotels,
   lighthouses) — both would have visibly broken a video about 753 BC had
   they gone in unchecked. Do this check for any segment where the setting's
   time period or authenticity matters, not just ones that "look risky" in
   the description.
3. **Check the duration** (for video clips) with `scripts/get_media_duration.py`
   if `ffprobe` isn't on the system — you need this to know how much of the
   clip you can safely use before it runs out. Prefer plain `ffprobe` first
   if installed.

## Naming and mapping

Keep a clear mapping from segment index to downloaded filename (e.g.
`segment-00-ocean-sunrise.mp4`, `segment-01-city-morning.jpg`) — it's easy to
lose track of which file goes with which line once you've downloaded footage
for eight or ten segments. Whatever structure you use to pass segment data
into the Remotion composition, include the source URL and author as a
comment or field next to each asset so credits can be generated later
without re-searching (unless the user has said credits aren't needed).

## File size: keep the repo committable

GitHub rejects any single file over 100MB, and Pexels' top-quality files
(4K/60fps) regularly exceed that for anything longer than a few seconds.
Since a segment typically only uses a few seconds of a much longer clip
anyway, trim before committing rather than downloading and committing the
full multi-hundred-MB source:

```
ffmpeg -y -ss <start> -i <downloaded-file> -t <duration+buffer> \
  -vf "scale='min(1920,iw)':-2" -c:v libx264 -preset veryfast -crf 20 -an <output>
```

If `ffmpeg` isn't on the system, `pip install imageio-ffmpeg` gets a bundled
static binary (`python3 -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"`
prints its path) — this project didn't have ffmpeg preinstalled and that
was the fix. Pick the API's non-4K file variants (1920x1080 or 1280x720)
in the first place when the search result offers them — smaller to
download and already close to final size, so less to trim.

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
