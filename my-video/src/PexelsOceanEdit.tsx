import {
  AbsoluteFill,
  Easing,
  OffthreadVideo,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

// Source clip: "Ocean Waves" by Pixabay, free stock video from Pexels
// https://www.pexels.com/video/ocean-waves-856204/ (CC0 — free to use)
const TITLE_DURATION = 75; // 2.5s @ 30fps
const CROSSFADE = 20; // ~0.67s dissolve between title and video
const VIDEO_START_IN_SOURCE = 30 * 2; // skip the first 2s of the source clip
const VIDEO_DURATION = 30 * 10; // 10s of footage
const OUTRO_FADE = 30; // 1s fade to black at the end
const BAR_HEIGHT = 64;

const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 18, TITLE_DURATION - CROSSFADE, TITLE_DURATION],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(frame, [0, 24], [0.94, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#04141c",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 84,
            color: "#eaf6fa",
            letterSpacing: 8,
          }}
        >
          OCEAN WAVES
        </div>
        <div
          style={{
            marginTop: 18,
            fontFamily: "Arial, sans-serif",
            fontSize: 24,
            color: "#8fb4c2",
            letterSpacing: 5,
            textTransform: "uppercase",
          }}
        >
          Free Stock Footage · Pexels
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LowerThird: React.FC<{ startAt: number }> = ({ startAt }) => {
  const frame = useCurrentFrame();
  const local = frame - startAt;
  if (local < 0 || local > 110) {
    return null;
  }
  const opacity = interpolate(local, [0, 12, 95, 110], [0, 1, 1, 0], {
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
        left: 90,
        bottom: 140,
        opacity,
        transform: `translateX(${x}px)`,
        display: "flex",
        alignItems: "center",
        gap: 18,
      }}
    >
      <div style={{ width: 6, height: 54, background: "#5fd3e8" }} />
      <div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 30,
            color: "white",
            fontWeight: 700,
          }}
        >
          Calm Sea, Golden Light
        </div>
        <div
          style={{
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            color: "#c6dbe2",
            letterSpacing: 1.5,
          }}
        >
          VIDEO BY PIXABAY · VIA PEXELS.COM
        </div>
      </div>
    </div>
  );
};

const OceanVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, VIDEO_DURATION], [1, 1.1]);
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
          src={staticFile("ocean-waves.mp4")}
          startFrom={VIDEO_START_IN_SOURCE}
          endAt={VIDEO_START_IN_SOURCE + VIDEO_DURATION}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "contrast(1.1) saturate(1.3) brightness(1.02)",
          }}
          volume={(f) =>
            interpolate(
              f,
              [0, CROSSFADE, VIDEO_DURATION - OUTRO_FADE, VIDEO_DURATION],
              [0, 0.8, 0.8, 0],
              { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
            )
          }
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,10,15,0.5) 100%)",
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
      <LowerThird startAt={45} />
    </AbsoluteFill>
  );
};

export const PexelsOceanEdit: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      <Sequence durationInFrames={TITLE_DURATION}>
        <TitleCard />
      </Sequence>
      <Sequence
        from={TITLE_DURATION - CROSSFADE}
        durationInFrames={VIDEO_DURATION}
      >
        <OceanVideo />
      </Sequence>
    </AbsoluteFill>
  );
};

export const PEXELS_OCEAN_EDIT_DURATION =
  TITLE_DURATION - CROSSFADE + VIDEO_DURATION;
