import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

const TITLE_DURATION = 72; // 3s @ 24fps
const CROSSFADE = 24; // 1s overlap between title and video
const VIDEO_START_IN_SOURCE = 24 * 6; // skip the first 6s of the source clip
const VIDEO_DURATION = 168; // 7s of footage
const OUTRO_FADE = 30;
const BAR_HEIGHT = 90;

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 20, TITLE_DURATION - CROSSFADE, TITLE_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(frame, [0, 24], [0.92, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#05070a",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 92,
            color: "#f4efe4",
            letterSpacing: 6,
          }}
        >
          BIG BUCK BUNNY
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "Arial, sans-serif",
            fontSize: 26,
            color: "#9aa5ad",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Blender Foundation (CC BY 3.0) — Sample Edit
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LowerThird: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  if (local < 0 || local > 96) {
    return null;
  }
  const opacity = interpolate(local, [0, 12, 84, 96], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const x = interpolate(local, [0, 16], [-40, 0], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 100,
        bottom: 160,
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 20,
      }}
    >
      <div style={{ width: 6, height: 60, background: "#e8c468" }} />
      <div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 34,
            color: "white",
            fontWeight: 700,
          }}
        >
          Wildlife B-roll
        </div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 20,
            color: "#cfd6da",
            letterSpacing: 2,
          }}
        >
          SAMPLE EDIT · REMOTION
        </div>
      </div>
    </div>
  );
};

const CinematicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, VIDEO_DURATION], [1, 1.08]);
  const opacity = interpolate(
    frame,
    [0, CROSSFADE, VIDEO_DURATION - OUTRO_FADE, VIDEO_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill style={{ backgroundColor: "black", opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale})` }}>
        <OffthreadVideo
          src={staticFile("bbb.mp4")}
          startFrom={VIDEO_START_IN_SOURCE}
          endAt={VIDEO_START_IN_SOURCE + VIDEO_DURATION}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "contrast(1.12) saturate(1.25) brightness(0.97)",
          }}
          volume={(f) =>
            interpolate(
              f,
              [0, CROSSFADE, VIDEO_DURATION - OUTRO_FADE, VIDEO_DURATION],
              [0, 0.9, 0.9, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: BAR_HEIGHT,
          background: "black",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: "100%",
          height: BAR_HEIGHT,
          background: "black",
        }}
      />
      <LowerThird startAt={48} />
    </AbsoluteFill>
  );
};

export const EditedTrailer: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={TITLE_DURATION}>
        <TitleCard />
      </Sequence>
      <Sequence
        from={TITLE_DURATION - CROSSFADE}
        durationInFrames={VIDEO_DURATION}
      >
        <CinematicVideo />
      </Sequence>
    </AbsoluteFill>
  );
};

export const EDITED_TRAILER_DURATION =
  TITLE_DURATION - CROSSFADE + VIDEO_DURATION;
