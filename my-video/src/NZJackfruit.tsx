import {
  AbsoluteFill,
  Audio,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Voiceover script (VN): "Vi sao New Zealand cam mang mit qua bien gioi" —
// segmented against the voiceover with scripts/segment_script.py
// (word-count proportional split, fps=30). The script text given trailed
// off mid-sentence ("...hay MPI, tat ca...") — per the user, that's fine as
// is; the last shot simply holds a little longer than its exact sentence.
//
// Footage sourced from Pexels via scripts/pexels_search.py (real API key):
// - nz-suitcase.mp4    : "Push-in shot of a packed suitcase" (clean, no modern-era issue — this is a present-day topic)
// - nz-jackfruit.mp4   : "Fruit on tree" — jackfruit hanging in a home garden (picked over a busy street-market clip for a cleaner, more universal "mit tu nha" shot)
// - nz-immigration.mp4 : "Passing through immigration in traveling an airport"
// - nz-baggage.mp4     : "Footage of people waiting for their luggage" (baggage claim, bookends the suitcase from shot 1)
//
// Following the pacing guidance in references/remotion-patterns.md: 6
// script lines merged into 4 held shots (~5-13s each), 24-frame crossfade.

const CROSSFADE = 24; // frames of dissolve at each cut, centered on the cut point
const COLOR_GRADE = "contrast(1.08) saturate(1.2) brightness(1.02)";

type KenBurns = "in" | "out";

interface SegmentDef {
  src: string;
  startFrom: number; // offset into the source clip, in composition-fps frames
  start: number; // this segment's start frame on the overall timeline
  end: number; // this segment's end frame on the overall timeline
  kenBurns: KenBurns;
}

const SEGMENTS: SegmentDef[] = [
  { src: "nz-suitcase.mp4", startFrom: 15, start: 0, end: 243, kenBurns: "in" },
  { src: "nz-jackfruit.mp4", startFrom: 15, start: 243, end: 624, kenBurns: "out" },
  { src: "nz-immigration.mp4", startFrom: 30, start: 624, end: 786, kenBurns: "in" },
  { src: "nz-baggage.mp4", startFrom: 30, start: 786, end: 932, kenBurns: "out" },
];

export const NZ_JACKFRUIT_DURATION = SEGMENTS[SEGMENTS.length - 1].end;

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
    kenBurns === "in" ? [1, 1.1] : [1.1, 1],
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

export const NZJackfruit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {SEGMENTS.map((seg, i) => {
        const half = CROSSFADE / 2;
        const renderFrom = Math.max(0, seg.start - half);
        const renderEnd = Math.min(NZ_JACKFRUIT_DURATION, seg.end + half);
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
      <Audio src={staticFile("nz-voiceover.mp3")} />
      <OpeningCloseFade totalDuration={NZ_JACKFRUIT_DURATION} />
    </AbsoluteFill>
  );
};
