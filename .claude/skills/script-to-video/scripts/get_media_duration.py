#!/usr/bin/env python3
"""Get the duration (in seconds) of an audio/video file without requiring
ffmpeg/ffprobe to be installed (this sandbox often lacks them).

Supports: .wav (exact, via the stdlib `wave` module), .mp4/.mov/.m4a
(exact, by parsing the `moov/mvhd` box), and .mp3 (approximate, via the
first frame's declared bitrate + file size — good enough for pacing a
video edit, not frame-accurate).

If ffprobe IS available on the system, prefer it directly instead of this
script — it's more accurate for everything. Reach for this script only
when ffprobe is missing.

Usage: python3 get_media_duration.py <path/to/file>
Prints a single float (seconds) to stdout, or an error to stderr + exit 1.
"""
import struct
import sys
import wave


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


# MPEG1 Layer III bitrate table (kbps), index 1-14 (0 and 15 are invalid/free).
_MP3_BITRATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 0]
_MP3_SAMPLERATES = [44100, 48000, 32000, 0]


def mp3_duration(path: str) -> float:
    """Approximate duration from the first valid frame header + file size.
    Accurate for CBR files; a reasonable estimate for VBR (average bitrate)."""
    with open(path, "rb") as f:
        data = f.read()

    # Skip an ID3v2 tag if present.
    offset = 0
    if data[:3] == b"ID3":
        size = (
            (data[6] & 0x7F) << 21
            | (data[7] & 0x7F) << 14
            | (data[8] & 0x7F) << 7
            | (data[9] & 0x7F)
        )
        offset = 10 + size

    for i in range(offset, min(offset + 100_000, len(data) - 4)):
        if data[i] == 0xFF and (data[i + 1] & 0xE0) == 0xE0:
            b1, b2 = data[i + 1], data[i + 2]
            layer_bits = (b1 >> 1) & 0x03
            if layer_bits != 0x01:  # only handling Layer III (most common)
                continue
            bitrate_idx = (b2 >> 4) & 0x0F
            samplerate_idx = (b2 >> 2) & 0x03
            bitrate = _MP3_BITRATES[bitrate_idx]
            samplerate = _MP3_SAMPLERATES[samplerate_idx]
            if bitrate == 0 or samplerate == 0:
                continue
            audio_bytes = len(data) - offset
            return (audio_bytes * 8) / (bitrate * 1000)

    raise ValueError("could not find a valid MP3 frame header")


def get_duration(path: str) -> float:
    lower = path.lower()
    if lower.endswith(".wav"):
        return wav_duration(path)
    if lower.endswith((".mp4", ".mov", ".m4a", ".m4v")):
        return mp4_duration(path)
    if lower.endswith(".mp3"):
        return mp3_duration(path)
    raise ValueError(f"unsupported extension for {path} — try ffprobe instead")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("usage: get_media_duration.py <file>", file=sys.stderr)
        sys.exit(1)
    try:
        print(get_duration(sys.argv[1]))
    except Exception as exc:  # noqa: BLE001
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
