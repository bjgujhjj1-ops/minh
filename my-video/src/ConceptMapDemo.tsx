import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";

// Demo of the "concept map" style requested by the user: a dark grid
// background, a title, a central figure in a rounded card, and related
// figures below connected to it with animated curved arrows. Modeled on a
// reference screenshot (a Vietnamese history/philosophy channel's "Dao"
// diagram) — this file exists to demonstrate the technique, not as a real
// script-driven video. Real subjects (Laozi, Confucius, the Buddha,
// Socrates) are pictured, so per the skill's "Named subjects" sourcing
// rule the portraits come from Wikimedia Commons, not stock sites:
// - demo-laozi.jpg     : File:Laozi.jpg — public domain
// - demo-confucius.jpg : File:Konfuzius-1770.jpg — public domain
// - demo-buddha.jpg    : File:Great Buddha Statue, Bodh Gaya.jpg — CC BY-SA 2.0, photo by Andrew Moore
// - demo-socrates.jpg  : File:Socrates Louvre.jpg — CC BY-SA 2.5, photo by Eric Gaba (Sting); statue itself is public domain

export const CONCEPT_MAP_DEMO_DURATION = 270; // 9s @ 30fps

const CARD_BG = "white";
const BG_COLOR = "#0a0e18";
const GRID_LINE = "rgba(255,255,255,0.05)";

interface CardDef {
  src: string;
  label: string;
  x: number; // center x
  y: number; // center y
  width: number;
  height: number;
  appearAt: number;
}

const CENTRAL: CardDef = { src: "demo-laozi.jpg", label: "Lão Tử", x: 960, y: 420, width: 340, height: 460, appearAt: 20 };

const SATELLITES: CardDef[] = [
  { src: "demo-confucius.jpg", label: "Khổng Tử", x: 330, y: 860, width: 220, height: 300, appearAt: 70 },
  { src: "demo-buddha.jpg", label: "Đức Phật", x: 960, y: 860, width: 220, height: 300, appearAt: 90 },
  { src: "demo-socrates.jpg", label: "Socrates", x: 1590, y: 860, width: 220, height: 300, appearAt: 110 },
];

// Rough curve length estimate per arrow, just enough for the dash-offset
// draw-in animation to look fully drawn by the time it finishes — doesn't
// need to be pixel-exact.
const ARROWS: { from: CardDef; to: CardDef; length: number; drawStart: number }[] = [
  { from: SATELLITES[0], to: CENTRAL, length: 620, drawStart: 90 },
  { from: SATELLITES[1], to: CENTRAL, length: 320, drawStart: 110 },
  { from: SATELLITES[2], to: CENTRAL, length: 620, drawStart: 130 },
];

const GridBackground: React.FC = () => (
  <AbsoluteFill
    style={{
      backgroundColor: BG_COLOR,
      backgroundImage: `linear-gradient(${GRID_LINE} 1px, transparent 1px), linear-gradient(90deg, ${GRID_LINE} 1px, transparent 1px)`,
      backgroundSize: "60px 60px",
    }}
  />
);

const Card: React.FC<CardDef> = ({ src, label, x, y, width, height, appearAt }) => {
  const frame = useCurrentFrame();
  const local = frame - appearAt;
  const opacity = interpolate(local, [0, 18], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const scale = interpolate(local, [0, 18], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        top: y - height / 2,
        width,
        height,
        opacity,
        transform: `scale(${scale})`,
        borderRadius: 16,
        background: CARD_BG,
        boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
        overflow: "hidden",
        border: "3px solid rgba(255,255,255,0.15)",
      }}
    >
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          textAlign: "center",
          padding: "6px 0",
          background: "rgba(0,0,0,0.55)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: 20,
          fontWeight: 700,
        }}
      >
        {label}
      </div>
    </div>
  );
};

const Arrows: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <svg
      viewBox="0 0 1920 1080"
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
          <path d="M0,0 L6,3 L0,6 Z" fill="rgba(120,170,255,0.9)" />
        </marker>
      </defs>
      {ARROWS.map((arrow, i) => {
        const local = frame - arrow.drawStart;
        const offset = interpolate(local, [0, 40], [arrow.length, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });
        const fromX = arrow.from.x;
        const fromY = arrow.from.y - arrow.from.height / 2;
        const toX = arrow.to.x + (arrow.from.x < arrow.to.x ? -60 : arrow.from.x > arrow.to.x ? 60 : 0);
        const toY = arrow.to.y + arrow.to.height / 2;
        const midX = (fromX + toX) / 2;
        const midY = (fromY + toY) / 2 - 40;
        return (
          <path
            key={i}
            d={`M${fromX},${fromY} Q${midX},${midY} ${toX},${toY}`}
            fill="none"
            stroke="rgba(120,170,255,0.9)"
            strokeWidth={3}
            strokeDasharray={arrow.length}
            strokeDashoffset={offset}
            markerEnd="url(#arrowhead)"
          />
        );
      })}
    </svg>
  );
};

const Title: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [0, 20], [-20, 0], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        top: 60,
        width: "100%",
        textAlign: "center",
        opacity,
        transform: `translateY(${y}px)`,
        color: "white",
        fontFamily: "Georgia, serif",
        fontSize: 90,
        fontWeight: 700,
        letterSpacing: 4,
      }}
    >
      Đạo
    </div>
  );
};

const OverallFade: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 15, CONCEPT_MAP_DEMO_DURATION - 20, CONCEPT_MAP_DEMO_DURATION],
    [1, 0, 0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ backgroundColor: "black", opacity }} />;
};

export const ConceptMapDemo: React.FC = () => {
  return (
    <AbsoluteFill>
      <GridBackground />
      <Title />
      <Arrows />
      <Card {...CENTRAL} />
      {SATELLITES.map((s, i) => (
        <Card key={i} {...s} />
      ))}
      <OverallFade />
    </AbsoluteFill>
  );
};
