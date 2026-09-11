# Sourcing free footage from multiple stock sites

First decide what kind of visual the segment needs — this determines where
to even look:

- **Generic b-roll** (a landscape, an activity, a mood, an object) → stock
  sites below, Pexels first.
- **A real, named, identifiable subject** — a specific historical figure
  (Mao Zedong, not "a 1960s political leader"), a specific event, a specific
  building or landmark by name → skip stock sites entirely and go straight
  to "Named subjects" further down. Pexels/Pixabay/Mixkit/Coverr are
  libraries of generic footage; they structurally don't have photos of a
  specific real person, so searching them for one just wastes a round trip.

## Generic b-roll: stock sites

Default to Pexels via the API below — it's fast (one script call, no
scraping) and usually has something workable. Don't burn time
cross-checking every site for every single beat; that's slower for no
benefit when the first result is already good.

Reach for another source only when Pexels genuinely doesn't have it for a
*specific* beat — a niche subject, a look Pexels' library doesn't cover, or
(per Step 2's frame-check) every Pexels candidate failed inspection. At
that point, pick the next likely source for that particular need rather
than querying all of them:

- **Pixabay** (pixabay.com) — CC0-style, no attribution required, huge
  library that overlaps and diverges from Pexels' in useful ways. Has its
  own free API (pixabay.com/api/docs/) if the user ever provides a key,
  same pattern as Pexels; without one, browse it the WebSearch/WebFetch way
  described below.
- **Mixkit** (mixkit.co) — curated, no attribution required, generally
  higher production value per clip (more cinematic grading, smoother
  motion) than a random Pexels/Pixabay result — worth checking for shots
  where visual polish matters most (an opening/establishing shot, a hero
  moment).
- **Coverr** (coverr.co) — free for commercial use, small but well-shot
  library, good for abstract/mood b-roll (textures, ambient scenes) when a
  segment doesn't have a literal visual.
- **Videezy** (videezy.com) — mixed license terms; many clips require
  attribution. Only use it if a specific clip is worth crediting, and note
  the requirement next to the asset (see Naming and mapping below).

Whichever site a clip comes from, run it through the same download →
verify-by-frame → trim pipeline described later in this file — the source
doesn't change that part of the process.

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

## Browsing method: Pixabay, Mixkit, Coverr, and Pexels without a key

None of these have a bundled API-key script yet (only Pexels does, and only
because the user provided a key). Browse them like a person would with
`WebSearch` and `WebFetch`:

1. **Search.** `WebSearch` with `site:pixabay.com <keywords>`,
   `site:mixkit.co <keywords>`, or `site:coverr.co <keywords>` — same
   pattern as Pexels, just swap the domain. Run more than one site's search
   when the beat matters enough to be picky about the shot.
2. **Resolve the direct file URL.** `WebFetch` the chosen page with a prompt
   like "Find the direct downloadable file URL, the author name, and
   license." This is slower and less reliable than a real API (the fetch
   summary sometimes guesses at a filename pattern instead of quoting the
   real one — verify by checking the downloaded file, per the step below)
   but works with zero setup. This project's first Pexels edit
   (`my-video/public/ocean-waves.mp4`, from pexels.com/video/ocean-waves-856204)
   was sourced this way, before a Pexels API key was available.
3. This is also the fallback for Pexels itself if `my-video/.env` ever has
   no key configured — same method, `site:pexels.com`.

## Named subjects: real people, historical figures, specific events

Per the user's direction: when a segment needs a specific, identifiable
subject that stock libraries structurally don't carry (a named historical
figure like Mao Zedong, a specific battle or event, a named landmark),
search the open web instead of stock sites:

1. **Wikimedia Commons first** (commons.wikimedia.org). `WebSearch` with
   `site:commons.wikimedia.org <name or event>`, then `WebFetch` the file
   page. This is the best starting point for real people/events: a huge
   archive of public-domain and clearly-CC-licensed photos, and every file
   page states its exact license and source right there — read it rather
   than assuming. Anything old enough to be out of copyright, or released
   by a government/state media archive (many Mao-era Chinese photos,
   WWII-era photos, etc.), tends to be here with a clear license.
2. **Government/institutional archives** next — US National Archives,
   Library of Congress, other national archives. Same reasoning: real
   photos of real events with an explicit, checkable public-domain or
   open license.
3. **General web image search** (plain `WebSearch`, no site filter) is the
   last resort, not the first choice, for named subjects — most images on
   the open web are copyrighted press/news photos. Using an unlicensed
   image is a real legal risk once it's rendered into a video, not just a
   style nitpick. If a general search is genuinely the only source for a
   subject, check what the page says about the image's origin/license
   before using it (many note "public domain" or credit a photographer
   whose work may or may not be freely licensed) — don't grab the first
   result that looks visually right.
4. **Video of a real event/person is rarer than stills** — check Wikimedia
   Commons' video files first, but if nothing usable turns up, a still
   photo with a slow Ken Burns pan (same `FootageClip` pattern in
   `remotion-patterns.md`, `Img` in place of `OffthreadVideo`) is a normal,
   expected substitute in documentary editing, not a compromise to
   apologize for — most real documentaries do exactly this for archival
   subjects.

## Downloading and verifying (all methods)

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
