#!/usr/bin/env python3
"""Search Pexels via the official API and print direct, downloadable file
URLs as JSON — no more guessing filenames off the HTML page or scraping
search results with WebSearch/WebFetch.

Requires a Pexels API key (free, from pexels.com/api). Reads it from, in
order: the --api-key flag, the PEXELS_API_KEY environment variable, or a
`PEXELS_API_KEY=...` line in my-video/.env (or a --env-file you point at).
Never hardcode a key into a script or commit one into a file — my-video/.env
is already gitignored for exactly this reason.

Usage:
  python3 pexels_search.py videos "ancient roman ruins aerial" --per-page 5
  python3 pexels_search.py photos "misty mountain valley" --per-page 5
  python3 pexels_search.py videos "ocean waves" --orientation landscape

Output: a JSON array, each item roughly:
  videos -> {id, page_url, duration_s, width, height, user, files: [{quality, width, height, link}]}
  photos -> {id, page_url, width, height, user, src: {original, large2x, large, medium}}

`files`/`src` are sorted so the first entry is the best match for a 1080p
edit (largest file that doesn't exceed ~1920px wide) — pick that one unless
you specifically need 4K.
"""
import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API_BASE = "https://api.pexels.com"


def load_api_key(cli_key: str | None, env_file: str | None) -> str:
    if cli_key:
        return cli_key
    if os.environ.get("PEXELS_API_KEY"):
        return os.environ["PEXELS_API_KEY"]
    candidates = [env_file] if env_file else []
    candidates += ["my-video/.env", ".env", os.path.join(os.path.dirname(__file__), "..", "..", "..", "my-video", ".env")]
    for path in candidates:
        if path and os.path.isfile(path):
            with open(path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("PEXELS_API_KEY="):
                        return line.split("=", 1)[1].strip().strip('"').strip("'")
    print(
        "error: no Pexels API key found. Pass --api-key, set PEXELS_API_KEY, "
        "or put PEXELS_API_KEY=... in my-video/.env",
        file=sys.stderr,
    )
    sys.exit(1)


def fetch(endpoint: str, params: dict, api_key: str) -> dict:
    url = f"{API_BASE}{endpoint}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(
        url,
        headers={
            "Authorization": api_key,
            # Pexels sits behind Cloudflare, which blocks the default
            # python-urllib user agent outright (HTTP 403 / error 1010).
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        print(f"error: Pexels API returned HTTP {e.code}: {body}", file=sys.stderr)
        sys.exit(1)


def best_file_first(files: list[dict], max_width: int = 1920) -> list[dict]:
    def sort_key(f):
        w = f.get("width") or 0
        fits = w <= max_width
        return (not fits, -w if fits else w)

    return sorted(files, key=sort_key)


def search_videos(query: str, per_page: int, orientation: str | None, api_key: str) -> list[dict]:
    params = {"query": query, "per_page": per_page}
    if orientation:
        params["orientation"] = orientation
    data = fetch("/videos/search", params, api_key)
    out = []
    for v in data.get("videos", []):
        files = [
            {"quality": f.get("quality"), "width": f.get("width"), "height": f.get("height"), "link": f.get("link")}
            for f in v.get("video_files", [])
            if f.get("link")
        ]
        out.append(
            {
                "id": v["id"],
                "page_url": v["url"],
                "duration_s": v.get("duration"),
                "width": v.get("width"),
                "height": v.get("height"),
                "user": v.get("user", {}).get("name"),
                "files": best_file_first(files),
            }
        )
    return out


def search_photos(query: str, per_page: int, orientation: str | None, api_key: str) -> list[dict]:
    params = {"query": query, "per_page": per_page}
    if orientation:
        params["orientation"] = orientation
    data = fetch("/v1/search", params, api_key)
    out = []
    for p in data.get("photos", []):
        out.append(
            {
                "id": p["id"],
                "page_url": p["url"],
                "width": p.get("width"),
                "height": p.get("height"),
                "user": p.get("photographer"),
                "src": p.get("src", {}),
            }
        )
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("kind", choices=["videos", "photos"])
    parser.add_argument("query")
    parser.add_argument("--per-page", type=int, default=5)
    parser.add_argument("--orientation", choices=["landscape", "portrait", "square"], default=None)
    parser.add_argument("--api-key", default=None)
    parser.add_argument("--env-file", default=None)
    args = parser.parse_args()

    api_key = load_api_key(args.api_key, args.env_file)
    if args.kind == "videos":
        results = search_videos(args.query, args.per_page, args.orientation, api_key)
    else:
        results = search_photos(args.query, args.per_page, args.orientation, api_key)

    print(json.dumps(results, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
