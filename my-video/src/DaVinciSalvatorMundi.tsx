import {
  AbsoluteFill,
  Audio,
  Easing,
  Img,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Voiceover script (VN): intro to the Salvator Mundi auction + Leonardo da
// Vinci, segmented against the voiceover with scripts/segment_script.py
// (word-count proportional split, fps=30), then merged down to 6 held
// shots per the pacing guidance (no cut under ~2.5-3s).
//
// Real, named subjects throughout (the painting, Leonardo, the Mona Lisa)
// — sourced from Wikimedia Commons per the skill's "Named subjects" rule,
// not stock sites:
// - davinci-salvator-mundi.jpg : "Leonardo da Vinci, Salvator Mundi, c.1500, oil on walnut (framed)" — public domain (artist died 1519)
// - davinci-portrait.jpg       : "Leonardo da Vinci - presumed self-portrait - WGA12798" (red chalk, Biblioteca Reale, Turin) — public domain
// - davinci-monalisa.jpg       : "Mona Lisa, by Leonardo da Vinci, from C2RMF natural color" — public domain
// Auction location/gavel are generic scene-setting, not the literal 2017
// Christie's event (that footage is news-org copyrighted) — from Pexels:
// - davinci-nyc.mp4   : NYC skyline aerial
// - davinci-gavel.mp4 : gavel coming down

const CROSSFADE = 24; // frames of dissolve at each cut, centered on the cut point
const COLOR_GRADE = "contrast(1.1) saturate(1.1) brightness(0.99) sepia(0.05)";
const TITLE_DURATION = 326; // matches the voiceover's intro line

type Motion = { scale: [number, number]; x?: [number, number]; y?: [number, number] };

interface SegmentDef {
  type: "video" | "image";
  src: string;
  startFrom?: number; // video only, offset into the source clip
  start: number; // this segment's start frame on the overall timeline
  end: number; // this segment's end frame on the overall timeline
  motion: Motion;
  // objectFit:cover on a tall portrait image inside a 16:9 frame defaults
  // to a center crop, which on both da Vinci portraits landed on beard/torso
  // texture instead of the face — bias the crop toward the top with this.
  objectPosition?: string;
}

const SEGMENTS: SegmentDef[] = [
  { type: "video", src: "davinci-nyc.mp4", startFrom: 20, start: TITLE_DURATION, end: 580, motion: { scale: [1, 1.1] } },
  { type: "video", src: "davinci-gavel.mp4", startFrom: 20, start: 580, end: 835, motion: { scale: [1.08, 1] } },
  // Same source image as the next shot, but framed as a tight teaser (just
  // the gold frame corner) for the "record-breaking artwork" line, before
  // the next cut reveals the whole painting — two clips only 11s long
  // (nyc/gavel) can't stretch across this whole narration block, and a
  // still image has no such limit, so the painting itself absorbs the gap.
  {
    type: "image",
    src: "davinci-salvator-mundi.jpg",
    start: 835,
    end: 1038,
    motion: { scale: [1.6, 1.45], x: [10, 6], y: [-16, -10] },
  },
  {
    type: "image",
    src: "davinci-salvator-mundi.jpg",
    start: 1038,
    end: 1415,
    motion: { scale: [1.25, 1.4], y: [-8, 10] }, // zoom out to reveal the full painting, then pan down: face -> raised hand -> orb
  },
  {
    type: "image",
    src: "davinci-portrait.jpg",
    start: 1415,
    end: 1700,
    motion: { scale: [1.0, 1.1] },
    objectPosition: "50% 22%",
  },
  {
    type: "image",
    src: "davinci-monalisa.jpg",
    start: 1700,
    end: 1995,
    motion: { scale: [1.0, 1.1] },
    objectPosition: "50% 12%",
  },
];

export const DA_VINCI_SALVATOR_MUNDI_DURATION = SEGMENTS[SEGMENTS.length - 1].end;

const FootageClip: React.FC<{
  segment: SegmentDef;
  durationInFrames: number;
}> = ({ segment, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, CROSSFADE, durationInFrames - CROSSFADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(frame, [0, durationInFrames], segment.motion.scale);
  const x = segment.motion.x ? interpolate(frame, [0, durationInFrames], segment.motion.x) : 0;
  const y = segment.motion.y ? interpolate(frame, [0, durationInFrames], segment.motion.y) : 0;

  const Media = segment.type === "video" ? OffthreadVideo : Img;
  const mediaProps =
    segment.type === "video"
      ? { startFrom: segment.startFrom ?? 0, endAt: (segment.startFrom ?? 0) + durationInFrames, muted: true }
      : {};

  return (
    <AbsoluteFill style={{ backgroundColor: "black", opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale}) translate(${x}%, ${y}%)` }}>
        <Media
          src={staticFile(segment.src)}
          {...mediaProps}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: segment.objectPosition ?? "50% 50%",
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
      background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,0.5) 100%)",
    }}
  />
);

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 25, TITLE_DURATION - CROSSFADE, TITLE_DURATION], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleScale = interpolate(frame, [0, 35], [0.88, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const subtitleY = interpolate(frame, [15, 45], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        opacity,
        background: "radial-gradient(ellipse at center, #2b1d10 0%, #0d0805 100%)",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div style={{ textAlign: "center", transform: `scale(${titleScale})` }}>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 88,
            color: "#f0e2c8",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Thế Giới Cổ Đại
        </div>
        <div
          style={{
            marginTop: 22,
            fontFamily: "Arial, sans-serif",
            fontSize: 26,
            color: "#c9a468",
            letterSpacing: 4,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
          }}
        >
          MC QUANG THIÊN
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ClosingQuote: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  if (local < 0) return null;
  const opacity = interpolate(local, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(local, [0, 30], [30, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 110 }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 1400,
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontSize: 38,
          fontStyle: "italic",
          color: "white",
          textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          padding: "24px 48px",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 12,
        }}
      >
        "Trên người tài là thiên tài, trên thiên tài là người toàn tài,
        <br />
        còn trên cả người toàn tài, có lẽ chỉ còn Leonardo."
      </div>
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

export const DaVinciSalvatorMundi: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={TITLE_DURATION}>
        <TitleCard />
      </Sequence>
      {SEGMENTS.map((seg, i) => {
        const half = CROSSFADE / 2;
        const renderFrom = Math.max(0, seg.start - half);
        const renderEnd = Math.min(DA_VINCI_SALVATOR_MUNDI_DURATION, seg.end + half);
        const adjustedSeg =
          seg.type === "video"
            ? { ...seg, startFrom: (seg.startFrom ?? 0) - (seg.start - renderFrom) }
            : seg;
        return (
          <Sequence key={i} from={renderFrom} durationInFrames={renderEnd - renderFrom}>
            <FootageClip segment={adjustedSeg} durationInFrames={renderEnd - renderFrom} />
          </Sequence>
        );
      })}
      <Vignette />
      <Sequence from={SEGMENTS[SEGMENTS.length - 1].start}>
        <ClosingQuote startAt={30} />
      </Sequence>
      <Audio src={staticFile("davinci-voiceover.mp3")} />
      <OpeningCloseFade totalDuration={DA_VINCI_SALVATOR_MUNDI_DURATION} />
    </AbsoluteFill>
  );
};
