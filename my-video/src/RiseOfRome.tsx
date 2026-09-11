import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Voiceover script (VN): "Su khoi dau cua La Ma" — segmented against the
// voiceover with scripts/segment_script.py (word-count proportional split,
// fps=30). Footage sourced from Pexels (free, no attribution required):
// - rome-753bc-ruins.mp4   : "Drone Footage of Ancient Roman Ruins" (Kenan Turguc)
// - rome-hilltop-ruins.mp4 : "Aerial View of Ancient Ruins in Scenic Landscape" (Samir Smier)
// - rome-valley-river.mp4  : "Drone Footage of a River in a Mountain Valley" (Roger Ben)
// - rome-amphitheater.mp4  : "Aerial View of Ancient Amphitheater in Antalya" (unattributed)
// - rome-castle-sea.mp4    : "Historical" — Alanya Castle at sunset (Gokhan Yildiz)
// - rome-colosseum.mp4     : "The Roman Colosseum Under Blue Sky" (Rafael Castro)
//
// Earlier picks for the village and Mediterranean beats (a modern Brazilian
// river village, a Turkish resort coastline, tourist yachts) read as visibly
// present-day on inspection — cars, resort buildings, motor boats — which
// breaks a piece about 753 BC. Swapped for footage with no modern giveaways.
//
// Each source clip is trimmed to a few seconds around what's actually used
// (GitHub's 100MB file limit rejected the original 4K/60fps downloads) —
// startFrom values below are offsets into the trimmed file, not the original.

const CROSSFADE = 12; // frames of dissolve at each cut, centered on the cut point
const COLOR_GRADE = "contrast(1.12) saturate(1.15) brightness(0.98)";

type KenBurns = "in" | "out";

interface SegmentDef {
  src: string;
  startFrom: number; // offset into the source clip, in composition-fps frames
  start: number; // this segment's start frame on the overall timeline
  end: number; // this segment's end frame on the overall timeline
  kenBurns: KenBurns;
}

// Start/end frames come straight from segment_script.py's output for the
// voiceover — keep these as the timing source of truth so cuts stay in
// sync with the narration. Segments 2 and 3 of the script (the small
// village, and rising from it) share one continuous shot rather than
// cutting again for a beat under a second long.
const SEGMENTS: SegmentDef[] = [
  { src: "rome-753bc-ruins.mp4", startFrom: 30, start: 0, end: 99, kenBurns: "in" },
  { src: "rome-hilltop-ruins.mp4", startFrom: 10, start: 99, end: 125, kenBurns: "out" },
  { src: "rome-valley-river.mp4", startFrom: 30, start: 125, end: 235, kenBurns: "in" },
  { src: "rome-amphitheater.mp4", startFrom: 30, start: 235, end: 277, kenBurns: "out" },
  { src: "rome-castle-sea.mp4", startFrom: 30, start: 277, end: 323, kenBurns: "in" },
  { src: "rome-colosseum.mp4", startFrom: 30, start: 323, end: 391, kenBurns: "out" },
];

export const RISE_OF_ROME_DURATION = SEGMENTS[SEGMENTS.length - 1].end;

const FootageClip: React.FC<{
  src: string;
  startFrom: number;
  durationInFrames: number;
  kenBurns: KenBurns;
}> = ({ src, startFrom, durationInFrames, kenBurns }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, CROSSFADE, durationInFrames - CROSSFADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(
    frame,
    [0, durationInFrames],
    kenBurns === "in" ? [1, 1.12] : [1.12, 1],
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black", opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={staticFile(src)}
          startFrom={startFrom}
          endAt={startFrom + durationInFrames}
          muted
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: COLOR_GRADE,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const Vignette: React.FC = () => (
  <AbsoluteFill
    style={{
      background:
        "radial-gradient(ellipse at center, rgba(0,0,0,0) 45%, rgba(0,0,0,0.45) 100%)",
    }}
  />
);

const OpeningCloseFade: React.FC<{ totalDuration: number }> = ({ totalDuration }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 20, totalDuration - 25, totalDuration],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ backgroundColor: "black", opacity }} />;
};

export const RiseOfRome: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {SEGMENTS.map((seg, i) => {
        const half = CROSSFADE / 2;
        const renderFrom = Math.max(0, seg.start - half);
        const renderEnd = Math.min(RISE_OF_ROME_DURATION, seg.end + half);
        return (
          <Sequence key={i} from={renderFrom} durationInFrames={renderEnd - renderFrom}>
            <FootageClip
              src={seg.src}
              startFrom={seg.startFrom - (seg.start - renderFrom)}
              durationInFrames={renderEnd - renderFrom}
              kenBurns={seg.kenBurns}
            />
          </Sequence>
        );
      })}
      <Vignette />
      <Audio src={staticFile("rome-voiceover.mp3")} />
      <OpeningCloseFade totalDuration={RISE_OF_ROME_DURATION} />
    </AbsoluteFill>
  );
};
