#!/usr/bin/env python3
"""Get the duration (in seconds) of an audio/video file.

Tries, in order:
1. `ffprobe` if it's on the system PATH.
2. `ffmpeg` if it's on the system PATH.
3. The `imageio_ffmpeg`-bundled static ffmpeg binary (`pip install
   imageio-ffmpeg`) — this sandbox often lacks a system ffmpeg/ffprobe, and
   this is the reliable fallback rather than guessing.
4. Manual parsing (`wave` for .wav, `moov/mvhd` box for .mp4/.mov/.m4a) as a
   last resort when no ffmpeg binary can be found at all. There is no
   manual MP3 fallback: a real MP3 frame can be MPEG-1, -2, or -2.5, each
   with its OWN bitrate/sample-rate table, and it can be VBR — reading one
   frame's header and extrapolating linearly across the file guesses wrong
   whenever the actual encoding doesn't match those assumptions. This
   script used to do exactly that and under-reported a 12:48 file as 7:12
   (misread an MPEG-2 frame using the MPEG-1 bitrate table). Don't
   reintroduce that guess — if no ffmpeg binary is available, this script
   fails loudly for .mp3 instead of returning a wrong number silently.

Usage: python3 get_media_duration.py <path/to/file>
Prints a single float (seconds) to stdout, or an error to stderr + exit 1.
"""
import re
import shutil
import struct
import subprocess
import sys
import wave


def _find_ffmpeg_like_binary() -> str | None:
    for name in ("ffprobe", "ffmpeg"):
        path = shutil.which(name)
        if path:
            return path
    try:
        import imageio_ffmpeg

        return imageio_ffmpeg.get_ffmpeg_exe()
    except Exception:  # noqa: BLE001
        return None


def ffmpeg_duration(path: str) -> float:
    binary = _find_ffmpeg_like_binary()
    if binary is None:
        raise RuntimeError("no ffprobe/ffmpeg binary found (system or imageio_ffmpeg)")

    if binary.endswith("ffprobe"):
        out = subprocess.run(
            [binary, "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", path],
            capture_output=True, text=True, check=True,
        )
        return float(out.stdout.strip())

    # ffmpeg (system or imageio_ffmpeg-bundled): parse "Duration: HH:MM:SS.ss" from stderr.
    out = subprocess.run([binary, "-i", path], capture_output=True, text=True)
    match = re.search(r"Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)", out.stderr)
    if not match:
        raise RuntimeError(f"could not find Duration in ffmpeg output for {path}")
    h, m, s = match.groups()
    return int(h) * 3600 + int(m) * 60 + float(s)


def wav_duration(path: str) -> float:
    with wave.open(path, "rb") as w:
        return w.getnframes() / float(w.getframerate())


def mp4_duration(path: str) -> float:
    with open(path, "rb") as f:
        data = f.read()

    def find_box(buf: bytes, box_type: bytes, start: int = 0):
        i = start
        while i < len(buf) - 8:
            size = struct.unpack(">I", buf[i : i + 4])[0]
            btype = buf[i + 4 : i + 8]
            if btype == box_type:
                return i, size
            if size == 0:
                break
            i += size
        return None, None

    idx, size = find_box(data, b"moov")
    if idx is None:
        raise ValueError("no moov box found — is this a valid mp4/mov?")
    moov = data[idx + 8 : idx + size]
    idx2, size2 = find_box(moov, b"mvhd")
    if idx2 is None:
        raise ValueError("no mvhd box found inside moov")
    mvhd = moov[idx2 + 8 : idx2 + size2]
    version = mvhd[0]
    if version == 1:
        timescale = struct.unpack(">I", mvhd[20:24])[0]
        duration = struct.unpack(">Q", mvhd[24:32])[0]
    else:
        timescale = struct.unpack(">I", mvhd[12:16])[0]
        duration = struct.unpack(">I", mvhd[16:20])[0]
    return duration / timescale


def get_duration(path: str) -> float:
    try:
        return ffmpeg_duration(path)
    except Exception as ffmpeg_error:  # noqa: BLE001
        lower = path.lower()
        if lower.endswith(".wav"):
            return wav_duration(path)
        if lower.endswith((".mp4", ".mov", ".m4a", ".m4v")):
            return mp4_duration(path)
        raise RuntimeError(
            f"no ffmpeg/ffprobe available and no safe manual fallback for {path} "
            f"(original error: {ffmpeg_error}). Run `pip install imageio-ffmpeg` and retry "
            "rather than trusting a manual MP3 bitrate guess."
        ) from ffmpeg_error


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: get_media_duration.py <file>", file=sys.stderr)
        sys.exit(1)
    try:
        print(get_duration(sys.argv[1]))
    except Exception as exc:  # noqa: BLE001
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
