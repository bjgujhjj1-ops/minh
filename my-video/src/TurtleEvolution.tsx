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

// "Rùa hóa" — Convergent Evolution / why so many unrelated lineages evolve
// turtle-like shells. Voiceover-driven documentary, fps=30, segmented from
// the full script with scripts/segment_script.py then merged/split down to
// ~42 held shots per the pacing guidance (no cut under ~2.5-3s; several
// long script beats split into 2-3 shots for visual variety instead of one
// static hold).
//
// Real footage (Pexels, generic b-roll — no named/extinct subject in these):
//   turtle-seaturtle-raw.mp4   : real sea turtle swimming (Pexels)
//   turtle-tortoise-long-raw.mp4: real giant tortoise walking, close-up shell (Pexels)
//   turtle-ladybug-raw.mp4     : real ladybug macro (Pexels)
//   turtle-cathedral-raw.mp4   : real cathedral dome ceiling (Pexels)
//   turtle-space-long-raw.mp4  : real starry night sky timelapse (Pexels)
//   turtle-armadillo-raw.mp4   : real nine-banded armadillo (Pexels)
//   turtle-coral-raw.mp4       : real coral reef with fish (Pexels)
//   turtle-fossil-raw.mp4      : real hand holding a fossil bone (Pexels)
//
// Named extinct species — paleoart from Wikimedia Commons, licensed CC
// BY-SA/CC BY (attribution: Nobu Tamura unless noted), per the skill's
// "Named subjects" rule (stock libraries don't carry these at all):
//   turtle-henodus.jpg       : Henodus chelyops life restoration — Nobu Tamura, CC BY-SA 4.0
//   turtle-eunotosaurus.jpg  : Eunotosaurus africanus life restoration — Nobu Tamura, CC BY-SA 4.0
//   turtle-glyptodon.jpg     : Glyptodon restoration — Pavel Riha, CC BY-SA 3.0/GFDL
//   turtle-cyamodus.jpg      : Cyamodus life restoration — Nobu Tamura, CC BY 3.0/GFDL
//   turtle-odontochelys.jpg  : Odontochelys semitestacea restoration — Nobu Tamura, CC BY 3.0/GFDL
//   turtle-archelon.jpg      : Archelon ischyros reconstruction — Ghedo, CC BY-SA 4.0

const CROSSFADE = 24;
const COLOR_GRADE = "contrast(1.08) saturate(1.15) brightness(1.02)";
const INK = "#eaf6f3";
const ACCENT = "#ffcf5c";
const TEAL = "#5cd6c0";
const DANGER = "#ff6b6b";
const GRAPHIC_BG = "radial-gradient(ellipse at center, #163a44 0%, #05141a 100%)";

// ---------------------------------------------------------------------------
// Shot list: 42 shots covering frames 0-23060 (768.65s @ 30fps) contiguously.
// ---------------------------------------------------------------------------

type Motion = { scale: [number, number]; x?: [number, number]; y?: [number, number] };

type MediaShot = {
  kind: "video" | "image";
  src: string;
  start: number;
  end: number;
  startFrom?: number;
  motion: Motion;
  objectPosition?: string;
};

type GraphicShot = {
  kind: "graphic";
  start: number;
  end: number;
  graphic: string;
  props?: Record<string, unknown>;
};

type Shot = MediaShot | GraphicShot;

const M = (scale: [number, number], extra: Partial<Motion> = {}): Motion => ({ scale, ...extra });

const SHOTS: Shot[] = [
  { kind: "graphic", start: 0, end: 300, graphic: "title" },
  { kind: "video", src: "turtle-seaturtle-raw.mp4", startFrom: 0, start: 300, end: 650, motion: M([1, 1.12]) },
  { kind: "graphic", start: 650, end: 843, graphic: "textcard", props: { text: "TẠI SAO LÀ... RÙA?" } },
  {
    kind: "graphic",
    start: 843,
    end: 1585,
    graphic: "iconrow",
    props: {
      title: "BẠN LÀ KỸ SƯ SINH HỌC. BẠN SẼ CHỌN GÌ?",
      items: [
        { icon: "wing", label: "Đôi cánh" },
        { icon: "bolt", label: "Tốc độ phi mã" },
        { icon: "shield", label: "Bộ giáp bất khả xâm phạm", highlighted: true },
      ],
    },
  },
  { kind: "video", src: "turtle-tortoise-long-raw.mp4", startFrom: 0, start: 1585, end: 2145, motion: M([1.1, 1]) },
  { kind: "graphic", start: 2145, end: 2704, graphic: "ribshell", props: { mode: "formation", title: "MAI RÙA HÌNH THÀNH TỪ XƯƠNG SƯỜN + CỘT SỐNG" } },
  { kind: "graphic", start: 2704, end: 3213, graphic: "deeptime" },
  { kind: "image", src: "turtle-henodus.jpg", start: 3213, end: 3765, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-henodus.jpg", start: 3765, end: 4318, motion: M([1.15, 1.3], { x: [4, -4] }) },
  {
    kind: "graphic",
    start: 4318,
    end: 4980,
    graphic: "iconrow",
    props: {
      title: "PHÁO ĐÀI DI ĐỘNG",
      items: [
        { icon: "bolt", label: "Chạy nhanh hơn kẻ săn mồi" },
        { icon: "shield", label: "Trở nên quá khó để nuốt trôi", highlighted: true },
      ],
    },
  },
  { kind: "image", src: "turtle-eunotosaurus.jpg", start: 4980, end: 5507, motion: M([1, 1.12]) },
  { kind: "graphic", start: 5507, end: 6034, graphic: "ribshell", props: { mode: "anchor", title: "MỎ NEO ĐÀO HANG, TRƯỚC KHI LÀ GIÁP" } },
  { kind: "image", src: "turtle-glyptodon.jpg", start: 6034, end: 6597, motion: M([1, 1.13]) },
  {
    kind: "graphic",
    start: 6597,
    end: 7161,
    graphic: "iconrow",
    props: {
      title: "KỶ BĂNG HÀ NAM MỸ",
      items: [
        { icon: "claw", label: "Chim ăn thịt khổng lồ" },
        { icon: "claw", label: "Hổ răng kiếm" },
        { icon: "shield", label: "→ Mai vòm khổng lồ", highlighted: true },
      ],
    },
  },
  { kind: "image", src: "turtle-cyamodus.jpg", start: 7161, end: 7750, motion: M([1, 1.1]) },
  { kind: "graphic", start: 7750, end: 8622, graphic: "shoulderblade" },
  {
    kind: "graphic",
    start: 8622,
    end: 9691,
    graphic: "iconrow",
    props: {
      title: "CÁI GIÁ PHẢI TRẢ",
      items: [
        { icon: "lungs", label: "Không thể hít thở bằng cơ hoành", tone: "negative" },
        { icon: "thermometer", label: "Một “khối nhiệt” khổng lồ", tone: "negative" },
      ],
    },
  },
  { kind: "video", src: "turtle-tortoise-long-raw.mp4", startFrom: 100, start: 9691, end: 10195, motion: M([1.08, 1]) },
  { kind: "graphic", start: 10195, end: 10454, graphic: "textcard", props: { text: "SỐNG CHẬM • THỌ LÂU" } },
  { kind: "video", src: "turtle-ladybug-raw.mp4", startFrom: 0, start: 10454, end: 11115, motion: M([1, 1.15]) },
  { kind: "video", src: "turtle-seaturtle-raw.mp4", startFrom: 0, start: 11115, end: 11505, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-tortoise-long-raw.mp4", startFrom: 200, start: 11505, end: 11995, motion: M([1, 1.1]) },
  { kind: "graphic", start: 11995, end: 12693, graphic: "stablepoints", props: { label: "RÙA", title: "500 TRIỆU NĂM TIẾN HÓA" } },
  { kind: "video", src: "turtle-space-long-raw.mp4", startFrom: 0, start: 12693, end: 13252, motion: M([1, 1.1]) },
  { kind: "image", src: "turtle-archelon.jpg", start: 13252, end: 13812, motion: M([1.1, 1.25]) },
  { kind: "video", src: "turtle-space-long-raw.mp4", startFrom: 180, start: 13812, end: 14379, motion: M([1.08, 1]) },
  { kind: "video", src: "turtle-coral-raw.mp4", startFrom: 0, start: 14379, end: 14837, motion: M([1, 1.12]) },
  { kind: "graphic", start: 14837, end: 15099, graphic: "outrocta" },
  { kind: "video", src: "turtle-fossil-raw.mp4", startFrom: 0, start: 15099, end: 15564, motion: M([1.1, 1]) },
  { kind: "image", src: "turtle-odontochelys.jpg", start: 15564, end: 16135, motion: M([1, 1.15]) },
  { kind: "graphic", start: 16135, end: 16706, graphic: "citation" },
  { kind: "graphic", start: 16706, end: 17375, graphic: "ribshell", props: { mode: "embryo", title: "PHÔI RÙA: XƯƠNG SƯỜN MỌC NGANG VÀO DA LƯNG" } },
  { kind: "graphic", start: 17375, end: 18182, graphic: "hox" },
  { kind: "graphic", start: 18182, end: 19018, graphic: "stablepoints", props: { label: "NGẮN NHẤT", title: "TIẾN HÓA CÓ ĐỊNH HƯỚNG", variant: 2 } },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 0, start: 19018, end: 19513, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-coral-raw.mp4", startFrom: 100, start: 19513, end: 20007, motion: M([1.1, 1]) },
  { kind: "graphic", start: 20007, end: 20501, graphic: "phbuffer" },
  { kind: "graphic", start: 20501, end: 20995, graphic: "scalecompare" },
  { kind: "image", src: "turtle-cyamodus.jpg", start: 20995, end: 21489, motion: M([1.15, 1.3], { y: [4, -4] }) },
  { kind: "image", src: "turtle-eunotosaurus.jpg", start: 21489, end: 22122, motion: M([1.15, 1.3], { x: [-4, 4] }) },
  { kind: "video", src: "turtle-cathedral-raw.mp4", startFrom: 0, start: 22122, end: 22591, motion: M([1, 1.15]) },
  { kind: "graphic", start: 22591, end: 23060, graphic: "outro" },
];

export const TURTLE_EVOLUTION_DURATION = SHOTS[SHOTS.length - 1].end;

// ---------------------------------------------------------------------------
// Call-out text overlays (layered on top of media shots)
// ---------------------------------------------------------------------------

type Callout =
  | { from: number; duration: number; kind: "title"; title: string; subtitle: string }
  | { from: number; duration: number; kind: "stat"; value: string; label: string }
  | { from: number; duration: number; kind: "quote"; text: string };

const CALLOUTS: Callout[] = [
  { from: 1615, duration: 130, kind: "title", title: "Mai Rùa", subtitle: "XƯƠNG SƯỜN + CỘT SỐNG HỢP NHẤT" },
  { from: 3255, duration: 130, kind: "title", title: "Henodus", subtitle: "PLACODONT — TRIAS, ~230 TRIỆU NĂM TRƯỚC" },
  { from: 3810, duration: 150, kind: "stat", value: "GIẢI PHÁP TỐI ƯU", label: "CHO LỐI SỐNG ĐẦM PHÁ NÔNG" },
  { from: 5015, duration: 130, kind: "title", title: "Eunotosaurus", subtitle: "MỘT TRONG NHỮNG TỔ TIÊN SỚM NHẤT" },
  { from: 6070, duration: 130, kind: "title", title: "Glyptodon", subtitle: "THÚ CÓ VÚ MANG HÌNH RÙA" },
  { from: 7195, duration: 130, kind: "title", title: "Cyamodus", subtitle: "HAI LỚP MAI RIÊNG BIỆT" },
  { from: 10490, duration: 130, kind: "title", title: "Bọ Rùa", subtitle: "CÁNH CỨNG CHE PHỦ TOÀN THÂN" },
  { from: 11150, duration: 120, kind: "stat", value: "MAI DẸT", label: "GIẢM LỰC CẢN CỦA NƯỚC" },
  { from: 11545, duration: 120, kind: "stat", value: "MAI VÒM", label: "CHỐNG LỰC CẮN CỦA THÚ DỮ" },
  { from: 13290, duration: 160, kind: "quote", text: "Chậm mà chắc, bảo thủ nhưng bất diệt." },
  { from: 13860, duration: 150, kind: "stat", value: "Ở HÀNH TINH KHÁC?", label: "NẾU CÓ SỰ SỐNG, CÓ THỂ CŨNG CÓ “RÙA”" },
  { from: 15135, duration: 130, kind: "title", title: "Mắt Xích Thiếu", subtitle: "HỒ SƠ HÓA THẠCH GÂY TRANH CÃI" },
  { from: 15600, duration: 150, kind: "title", title: "Odontochelys semitestacea", subtitle: "TRUNG QUỐC, PHÁT HIỆN NĂM 2008" },
  { from: 19055, duration: 140, kind: "stat", value: "CaCO₃ + PHỐT PHÁT", label: "THÀNH PHẦN CHÍNH CỦA MAI RÙA" },
  { from: 19550, duration: 140, kind: "stat", value: "THIẾU OXY", label: "→ TÍCH TỤ AXIT LACTIC KHI LẶN SÂU" },
  { from: 21035, duration: 130, kind: "stat", value: "CÁNH NGẦM DƯỚI NƯỚC", label: "BỤNG PHẲNG GIÚP ỔN ĐỊNH KHI BƠI" },
  { from: 21525, duration: 150, kind: "title", title: "Tổ tiên, hay kẻ bắt chước?", subtitle: "EUNOTOSAURUS ĐÃ GÂY TRANH CÃI HỌC THUẬT" },
];

// ---------------------------------------------------------------------------
// Core footage clip: fade + Ken Burns + color grade
// ---------------------------------------------------------------------------

const FootageClip: React.FC<{ shot: MediaShot; durationInFrames: number }> = ({ shot, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, CROSSFADE, durationInFrames - CROSSFADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const scale = interpolate(frame, [0, durationInFrames], shot.motion.scale);
  const x = shot.motion.x ? interpolate(frame, [0, durationInFrames], shot.motion.x) : 0;
  const y = shot.motion.y ? interpolate(frame, [0, durationInFrames], shot.motion.y) : 0;

  const Media = shot.kind === "video" ? OffthreadVideo : Img;
  const mediaProps =
    shot.kind === "video"
      ? { startFrom: shot.startFrom ?? 0, endAt: (shot.startFrom ?? 0) + durationInFrames, muted: true }
      : {};

  return (
    <AbsoluteFill style={{ backgroundColor: "black", opacity }}>
      <AbsoluteFill style={{ transform: `scale(${scale}) translate(${x}%, ${y}%)` }}>
        <Media
          src={staticFile(shot.src)}
          {...mediaProps}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: shot.objectPosition ?? "50% 50%",
            filter: COLOR_GRADE,
          }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const GraphicFade: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({ durationInFrames, children }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, CROSSFADE, durationInFrames - CROSSFADE, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

// ---------------------------------------------------------------------------
// Icons (simple flat vector glyphs, hand-drawn — no icon library / licensing)
// ---------------------------------------------------------------------------

const ICON_PATHS: Record<string, React.ReactNode> = {
  shield: <path d="M0,-42 L36,-25 L36,8 Q36,42 0,58 Q-36,42 -36,8 L-36,-25 Z" />,
  bolt: <polygon points="8,-42 -20,8 0,8 -10,42 24,-6 2,-6" />,
  wing: <path d="M-42,12 Q-14,-42 42,-30 Q10,-8 32,22 Q0,4 -18,26 Q-30,6 -42,12 Z" />,
  lungs: (
    <>
      <ellipse cx="-16" cy="4" rx="17" ry="28" />
      <ellipse cx="16" cy="4" rx="17" ry="28" />
      <rect x="-4" y="-26" width="8" height="18" />
    </>
  ),
  thermometer: (
    <>
      <rect x="-8" y="-42" width="16" height="62" rx="8" />
      <circle cx="0" cy="30" r="17" />
    </>
  ),
  claw: (
    <>
      <polygon points="-24,-40 -14,4 -34,4" />
      <polygon points="0,-44 10,4 -10,4" />
      <polygon points="24,-40 34,4 14,4" />
    </>
  ),
};

const Icon: React.FC<{ name: string; size?: number; fill: string }> = ({ name, size = 1, fill }) => (
  <g transform={`scale(${size})`} fill={fill}>
    {ICON_PATHS[name]}
  </g>
);

// ---------------------------------------------------------------------------
// Graphic: Title card (intro)
// ---------------------------------------------------------------------------

const GraphicTitle: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const titleScale = interpolate(frame, [0, 35], [0.88, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  const subOpacity = interpolate(frame, [15, 45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const subY = interpolate(frame, [15, 45], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const domeArc = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <svg width="360" height="180" viewBox="0 0 360 180" style={{ position: "absolute", top: 130 }}>
          <path
            d={`M20,170 Q180,${170 - 150 * domeArc} 340,170`}
            fill="none"
            stroke={TEAL}
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.85}
          />
        </svg>
        <div style={{ textAlign: "center", transform: `scale(${titleScale})`, marginTop: 60 }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 104, color: INK, letterSpacing: 4 }}>
            RÙA HÓA
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: "Arial, sans-serif",
              fontSize: 26,
              color: ACCENT,
              letterSpacing: 6,
              opacity: subOpacity,
              transform: `translateY(${subY}px)`,
            }}
          >
            HIỆN TƯỢNG TIẾN HÓA ĐỒNG QUY
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: plain animated text card
// ---------------------------------------------------------------------------

const GraphicTextCard: React.FC<{ durationInFrames: number; text: string }> = ({ durationInFrames, text }) => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 25], [0.85, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${scale})`,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 72,
            color: INK,
            textAlign: "center",
            maxWidth: 1400,
            letterSpacing: 2,
          }}
        >
          {text}
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: icon choice / comparison row
// ---------------------------------------------------------------------------

type IconRowItem = { icon: string; label: string; highlighted?: boolean; tone?: "negative" };

const GraphicIconRow: React.FC<{ durationInFrames: number; title: string; items: IconRowItem[] }> = ({
  durationInFrames,
  title,
  items,
}) => {
  const frame = useCurrentFrame();
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 20], [-16, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 100,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 40,
            color: ACCENT,
            letterSpacing: 3,
            textAlign: "center",
            maxWidth: 1500,
          }}
        >
          {title}
        </div>
        <div style={{ display: "flex", gap: 90, alignItems: "flex-end" }}>
          {items.map((item, i) => {
            const stagger = 20 + i * 14;
            const localScale = interpolate(frame, [stagger, stagger + 25], [0.6, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.out(Easing.back(1.6)),
            });
            const localOpacity = interpolate(frame, [stagger, stagger + 20], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            const pop = item.highlighted
              ? interpolate(frame, [stagger + 40, stagger + 65], [1, 1.18], {
                  extrapolateLeft: "clamp",
                  extrapolateRight: "clamp",
                  easing: Easing.out(Easing.cubic),
                })
              : 1;
            const fill = item.tone === "negative" ? DANGER : item.highlighted ? ACCENT : "#9fb8bd";
            return (
              <div
                key={i}
                style={{
                  opacity: localOpacity,
                  transform: `scale(${localScale * pop})`,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 260,
                }}
              >
                <svg width="140" height="140" viewBox="-70 -70 140 140">
                  <Icon name={item.icon} fill={fill} />
                </svg>
                <div
                  style={{
                    marginTop: 20,
                    fontFamily: "Arial, sans-serif",
                    fontWeight: item.highlighted ? 800 : 600,
                    fontSize: 24,
                    color: item.highlighted ? ACCENT : INK,
                    textAlign: "center",
                  }}
                >
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: rib -> shell diagram (shared by formation / anchor / embryo modes)
// ---------------------------------------------------------------------------

const GraphicRibShell: React.FC<{ durationInFrames: number; mode: string; title: string }> = ({
  durationInFrames,
  mode,
  title,
}) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [20, durationInFrames - 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const ribCount = 6;
  const spineX = 0;

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 90,
            opacity: titleOpacity,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: ACCENT,
            letterSpacing: 2,
            textAlign: "center",
            maxWidth: 1400,
          }}
        >
          {title}
        </div>
        <svg width="700" height="700" viewBox="-350 -350 700 700">
          {/* spine */}
          <line x1={spineX} y1={-220} x2={spineX} y2={220} stroke={INK} strokeWidth={10} strokeLinecap="round" opacity={0.9} />
          {/* ribs: start hanging down close to spine, rotate outward + up into a fused dome arc */}
          {Array.from({ length: ribCount }).map((_, i) => {
            const t = i / (ribCount - 1);
            const yPos = -170 + t * 340;
            const startAngle = 165; // hanging down, close to vertical
            const endAngle = 60; // swept outward/up, tip reaching toward the dome line
            const angle = interpolate(progress, [0, 1], [startAngle, endAngle]);
            const length = interpolate(progress, [0, 1], [90, 230]);
            const rad = (angle * Math.PI) / 180;
            const x2 = spineX + Math.cos(rad) * length;
            const y2 = yPos - Math.sin(rad) * length * 0.4;
            return (
              <g key={i}>
                <line x1={spineX} y1={yPos} x2={x2} y2={y2} stroke={TEAL} strokeWidth={12} strokeLinecap="round" />
                <line x1={-spineX} y1={yPos} x2={-x2} y2={y2} stroke={TEAL} strokeWidth={12} strokeLinecap="round" />
              </g>
            );
          })}
          {/* dome arc appears once ribs are fused */}
          <path
            d="M-280,60 Q0,-260 280,60"
            fill="none"
            stroke={ACCENT}
            strokeWidth={8}
            strokeDasharray={800}
            strokeDashoffset={interpolate(progress, [0.7, 1], [800, 0], { extrapolateLeft: "clamp" })}
            opacity={0.9}
          />
          {mode === "anchor" && (
            <g opacity={interpolate(frame, [30, 55], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
              <circle cx={260} cy={30} r={14} fill={ACCENT} />
              <text x={260} y={80} fill={ACCENT} fontSize={22} fontFamily="Arial, sans-serif" textAnchor="middle">
                MỎ NEO
              </text>
            </g>
          )}
          {mode === "embryo" && (
            <g opacity={interpolate(frame, [40, 65], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}>
              <ellipse cx="0" cy="0" rx="330" ry="330" fill="none" stroke={INK} strokeWidth={3} strokeDasharray="10 12" opacity={0.35} />
              <text x={0} y={-300} fill={DANGER} fontSize={22} fontFamily="Arial, sans-serif" textAnchor="middle">
                PROTEIN CHẶN CƠ GIỮA CÁC XƯƠNG SƯỜN
              </text>
            </g>
          )}
        </svg>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: shoulder blade integration
// ---------------------------------------------------------------------------

const GraphicShoulderBlade: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [30, durationInFrames - 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const scapulaX = interpolate(progress, [0, 1], [-260, -60]);
  const arrowOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 90,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: ACCENT,
            letterSpacing: 2,
            textAlign: "center",
            maxWidth: 1400,
          }}
        >
          XƯƠNG BẢ VAI ĐI VÀO BÊN TRONG LỒNG NGỰC
        </div>
        <svg width="800" height="600" viewBox="-400 -300 800 600">
          {/* ribcage oval */}
          <ellipse cx={0} cy={0} rx={230} ry={200} fill="none" stroke={TEAL} strokeWidth={10} />
          {Array.from({ length: 5 }).map((_, i) => (
            <ellipse key={i} cx={0} cy={-140 + i * 65} rx={220 - i * 6} ry={26} fill="none" stroke={TEAL} strokeWidth={4} opacity={0.5} />
          ))}
          {/* scapula (paddle shape) sliding from outside the ribcage to inside */}
          <g transform={`translate(${scapulaX}, -20) rotate(-20)`}>
            <path d="M0,-70 Q40,-70 40,-20 L40,50 Q40,80 0,80 Q-30,80 -30,40 L-30,-30 Q-30,-70 0,-70 Z" fill={ACCENT} />
          </g>
          <text x={scapulaX} y={130} fill={ACCENT} fontSize={22} fontFamily="Arial, sans-serif" textAnchor="middle">
            XƯƠNG BẢ VAI
          </text>
          <path
            d="M-260,-140 Q-160,-200 -60,-150"
            fill="none"
            stroke={INK}
            strokeWidth={4}
            markerEnd="url(#arrow)"
            opacity={arrowOpacity}
          />
          <defs>
            <marker id="arrow" markerWidth="10" markerHeight="10" refX="6" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6 Z" fill={INK} />
            </marker>
          </defs>
        </svg>
        <div
          style={{
            position: "absolute",
            bottom: 90,
            fontFamily: "Arial, sans-serif",
            fontSize: 22,
            color: INK,
            opacity: 0.85,
            maxWidth: 1100,
            textAlign: "center",
          }}
        >
          Độc nhất vô nhị trong toàn bộ giới động vật có xương sống
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: deep-time card (230 million years ago / Triassic)
// ---------------------------------------------------------------------------

const GraphicDeepTime: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const markerX = interpolate(frame, [15, 50], [1500, 260], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const numberScale = interpolate(frame, [40, 65], [0.8, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.4)) });

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <svg width="1600" height="120" viewBox="0 0 1600 120" style={{ position: "absolute", top: 560 }}>
          <line x1={200} y1={60} x2={1550} y2={60} stroke={INK} strokeWidth={4} opacity={0.5} />
          <text x={1550} y={100} fill={INK} fontSize={20} fontFamily="Arial, sans-serif" textAnchor="end" opacity={0.7}>
            HIỆN TẠI
          </text>
          <text x={200} y={100} fill={INK} fontSize={20} fontFamily="Arial, sans-serif" textAnchor="start" opacity={0.7}>
            QUÁ KHỨ
          </text>
          <circle cx={markerX} cy={60} r={16} fill={ACCENT} />
        </svg>
        <div style={{ textAlign: "center", transform: `scale(${numberScale})` }}>
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 900, fontSize: 96, color: INK }}>230 TRIỆU NĂM</div>
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 30, color: ACCENT, letterSpacing: 4, marginTop: 10 }}>
            KỶ TRIAS — SỰ BÙNG NỔ HÌNH THÁI BÒ SÁT
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: stable points (adaptive landscape metaphor)
// ---------------------------------------------------------------------------

const GraphicStablePoints: React.FC<{ durationInFrames: number; label: string; title: string }> = ({
  durationInFrames,
  label,
  title,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [20, durationInFrames - 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  // landscape: two shallow valleys and one deep valley (the "turtle" solution) near x=760
  const path =
    "M40,120 C160,40 260,220 380,140 C500,60 620,260 760,300 C900,260 1020,60 1140,140 C1220,190 1300,120 1360,110";
  const ballX = interpolate(t, [0, 1], [80, 760]);
  const ballY = interpolate(t, [0, 0.5, 1], [110, 60, 300]);

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 100,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: ACCENT,
            letterSpacing: 2,
          }}
        >
          {title}
        </div>
        <svg width="1400" height="420" viewBox="0 0 1400 420">
          <path d={path} fill="none" stroke={TEAL} strokeWidth={6} opacity={0.8} />
          <circle cx={ballX} cy={ballY - 22} r={20} fill={ACCENT} />
          <text
            x={760}
            y={360}
            fill={ACCENT}
            fontSize={28}
            fontWeight={800}
            fontFamily="Arial, sans-serif"
            textAnchor="middle"
            opacity={interpolate(t, [0.85, 1], [0, 1], { extrapolateLeft: "clamp" })}
          >
            {label}
          </text>
        </svg>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: HOX gene
// ---------------------------------------------------------------------------

const GraphicHox: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const flip = interpolate(frame, [40, 80], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const rungs = 10;

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 90,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: ACCENT,
            letterSpacing: 2,
          }}
        >
          GEN HOX — BẢN ĐỒ CƠ THỂ
        </div>
        <svg width="500" height="560" viewBox="-250 -280 500 560">
          {Array.from({ length: rungs }).map((_, i) => {
            const y = -240 + i * 48;
            const phase = (frame / 20 + i * 0.6) % (Math.PI * 2);
            const x1 = Math.sin(phase) * 90;
            const x2 = Math.sin(phase + Math.PI) * 90;
            const isHox = i === 4;
            return (
              <g key={i}>
                <line x1={x1} y1={y} x2={x2} y2={y} stroke={isHox ? ACCENT : INK} strokeWidth={isHox ? 8 : 4} opacity={isHox ? 1 : 0.6} />
                <circle cx={x1} cy={y} r={9} fill={isHox ? ACCENT : TEAL} />
                <circle cx={x2} cy={y} r={9} fill={isHox ? ACCENT : TEAL} />
              </g>
            );
          })}
          <text x={140} y={-192} fill={ACCENT} fontSize={26} fontWeight={800} fontFamily="Arial, sans-serif">
            HOX
          </text>
        </svg>
        <div style={{ display: "flex", gap: 60, alignItems: "center", position: "absolute", bottom: 110 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: 1 - flip }}>
            <svg width="90" height="90" viewBox="-45 -45 90 90">
              <rect x={-6} y={-40} width={12} height={80} fill={TEAL} />
            </svg>
            <div style={{ color: INK, fontFamily: "Arial, sans-serif", fontSize: 20 }}>KHUNG ĐỠ</div>
          </div>
          <div style={{ color: INK, fontSize: 40 }}>→</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: flip }}>
            <svg width="90" height="90" viewBox="-45 -45 90 90">
              <Icon name="shield" fill={ACCENT} size={0.8} />
            </svg>
            <div style={{ color: ACCENT, fontFamily: "Arial, sans-serif", fontSize: 20, fontWeight: 700 }}>LỚP BẢO VỆ</div>
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: pH buffer bank
// ---------------------------------------------------------------------------

const GraphicPhBuffer: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const neutralize = interpolate(frame, [30, 90], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic) });
  const needleAngle = interpolate(neutralize, [0, 1], [-50, 10]);
  const dropY = interpolate(frame % 60, [0, 60], [-160, 20]);
  const gaugeColor = neutralize > 0.5 ? TEAL : DANGER;

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 90,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: ACCENT,
            letterSpacing: 2,
            textAlign: "center",
          }}
        >
          MAI RÙA: NGÂN HÀNG HÓA CHẤT
        </div>
        <svg width="900" height="560" viewBox="-450 -280 900 560">
          {/* shell dome container */}
          <path d="M-260,140 Q0,-220 260,140 Z" fill="none" stroke={TEAL} strokeWidth={10} />
          {/* acid drop */}
          <circle cx={-40} cy={dropY} r={14} fill={DANGER} opacity={dropY < 20 ? 1 : 0} />
          <text x={0} y={190} fill={INK} fontSize={22} fontFamily="Arial, sans-serif" textAnchor="middle" opacity={0.85}>
            CaCO₃ + Phốt phát trung hòa axit lactic
          </text>
          {/* pH gauge */}
          <g transform="translate(180, 40)">
            <path d="M-90,0 A90,90 0 0 1 90,0" fill="none" stroke={INK} strokeWidth={8} opacity={0.5} />
            <line
              x1={0}
              y1={0}
              x2={Math.cos((needleAngle * Math.PI) / 180) * 80}
              y2={Math.sin((needleAngle * Math.PI) / 180) * 80}
              stroke={gaugeColor}
              strokeWidth={6}
              strokeLinecap="round"
            />
            <circle cx={0} cy={0} r={8} fill={gaugeColor} />
            <text x={0} y={40} fill={gaugeColor} fontSize={22} fontWeight={800} fontFamily="Arial, sans-serif" textAnchor="middle">
              pH
            </text>
          </g>
        </svg>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: scale comparison (Archelon vs. human)
// ---------------------------------------------------------------------------

const GraphicScaleCompare: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const grow = interpolate(frame, [15, 55], [0.3, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.back(1.3)) });
  const labelOpacity = interpolate(frame, [50, 75], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 90,
            fontFamily: "Arial, sans-serif",
            fontWeight: 800,
            fontSize: 34,
            color: ACCENT,
            letterSpacing: 2,
          }}
        >
          Archelon — RÙA BIỂN KHỔNG LỒ
        </div>
        <svg width="1200" height="560" viewBox="0 0 1200 560">
          {/* baseline */}
          <line x1={100} y1={420} x2={1100} y2={420} stroke={INK} strokeWidth={3} opacity={0.4} />
          {/* human silhouette, fixed scale */}
          <g transform="translate(220, 420)">
            <circle cx={0} cy={-165} r={22} fill="#9fb8bd" />
            <rect x={-16} y={-142} width={32} height={110} rx={12} fill="#9fb8bd" />
          </g>
          <text x={220} y={530} fill="#9fb8bd" fontSize={20} fontFamily="Arial, sans-serif" textAnchor="middle">
            ~1.7 m
          </text>
          {/* archelon silhouette, scaled up to represent ~4m */}
          <g transform={`translate(700, 420) scale(${grow})`}>
            <ellipse cx={0} cy={-70} rx={220} ry={90} fill={ACCENT} />
            <circle cx={-210} cy={-95} r={40} fill={ACCENT} />
            <polygon points="180,-100 260,-150 250,-60" fill={ACCENT} />
            <polygon points="-40,10 20,70 -100,60" fill={ACCENT} />
            <polygon points="60,10 120,60 0,70" fill={ACCENT} />
          </g>
          <text x={700} y={530} fill={ACCENT} fontSize={26} fontWeight={800} fontFamily="Arial, sans-serif" textAnchor="middle" opacity={labelOpacity}>
            4 MÉT
          </text>
        </svg>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: source citation card (Odontochelys, 2008)
// ---------------------------------------------------------------------------

const GraphicCitation: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [20, 70], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardScale = interpolate(frame, [0, 20], [0.94, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${cardScale})`,
            width: 1000,
            background: "white",
            borderRadius: 14,
            padding: 48,
            boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
          }}
        >
          <div style={{ fontFamily: "Arial, sans-serif", fontSize: 16, color: "#888", marginBottom: 14 }}>
            HỒ SƠ HÓA THẠCH · TRUNG QUỐC · 2008
          </div>
          <div style={{ fontFamily: "Georgia, serif", fontSize: 28, lineHeight: 1.55, color: "#111", position: "relative" }}>
            <span style={{ background: `linear-gradient(90deg, #ffe066 ${sweep}%, transparent ${sweep}%)` }}>
              Odontochelys semitestacea — &quot;rùa có răng và nửa mai&quot; — 220 triệu năm tuổi, có mai bụng nhưng
              chưa có mai lưng.
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: like/subscribe CTA
// ---------------------------------------------------------------------------

const GraphicOutroCta: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 6) * 0.06;
  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, transform: `scale(${pulse})` }}>
          <svg width="120" height="120" viewBox="-60 -60 120 120">
            <circle r={55} fill={ACCENT} />
            <path d="M-18,10 L-18,-10 L0,-30 Q10,-30 8,-16 L20,-16 Q30,-16 28,-4 L22,10 Q18,20 6,20 L-18,20 Z" fill="#1a2a2e" />
          </svg>
          <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 800, fontSize: 36, color: INK, letterSpacing: 2 }}>
            LIKE • SUBSCRIBE
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

// ---------------------------------------------------------------------------
// Graphic: final outro
// ---------------------------------------------------------------------------

const GraphicOutro: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 25], [0, 1], { extrapolateRight: "clamp" });
  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div style={{ opacity, textAlign: "center", maxWidth: 1400 }}>
          <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 44, color: INK, lineHeight: 1.4 }}>
            &quot;Chiếc vòm là cấu trúc chịu lực tốt nhất trong kiến trúc.&quot;
          </div>
          <div style={{ marginTop: 24, fontFamily: "Arial, sans-serif", fontSize: 24, color: ACCENT, letterSpacing: 4 }}>
            RÙA HÓA — THẾ GIỚI CỔ ĐẠI
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

const GRAPHICS: Record<string, React.FC<{ durationInFrames: number; [key: string]: unknown }>> = {
  title: GraphicTitle,
  textcard: GraphicTextCard as React.FC<{ durationInFrames: number; [key: string]: unknown }>,
  iconrow: GraphicIconRow as unknown as React.FC<{ durationInFrames: number; [key: string]: unknown }>,
  ribshell: GraphicRibShell as unknown as React.FC<{ durationInFrames: number; [key: string]: unknown }>,
  shoulderblade: GraphicShoulderBlade,
  deeptime: GraphicDeepTime,
  stablepoints: GraphicStablePoints as unknown as React.FC<{ durationInFrames: number; [key: string]: unknown }>,
  hox: GraphicHox,
  phbuffer: GraphicPhBuffer,
  scalecompare: GraphicScaleCompare,
  citation: GraphicCitation,
  outrocta: GraphicOutroCta,
  outro: GraphicOutro,
};

// ---------------------------------------------------------------------------
// Callout overlays
// ---------------------------------------------------------------------------

const CalloutTitle: React.FC<{ title: string; subtitle: string; durationInFrames: number }> = ({ title, subtitle, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 20], [0.92, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: "center",
          background: "rgba(0,0,0,0.45)",
          padding: "16px 40px",
          borderRadius: 10,
        }}
      >
        <div style={{ fontFamily: "Georgia, serif", fontStyle: "italic", fontSize: 42, color: "white" }}>{title}</div>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 20, color: ACCENT, letterSpacing: 3, marginTop: 6 }}>{subtitle}</div>
      </div>
    </AbsoluteFill>
  );
};

const CalloutStat: React.FC<{ value: string; label: string; durationInFrames: number }> = ({ value, label, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 20], [20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: "0 0 130px 90px" }}>
      <div style={{ opacity, transform: `translateY(${y}px)` }}>
        <div style={{ fontFamily: "Arial, sans-serif", fontWeight: 800, fontSize: 56, color: "white", textShadow: "0 4px 20px rgba(0,0,0,0.8)" }}>
          {value}
        </div>
        <div style={{ fontFamily: "Arial, sans-serif", fontSize: 22, color: ACCENT, letterSpacing: 2, marginTop: 4, maxWidth: 700 }}>
          {label}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CalloutQuote: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, durationInFrames - 20, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 25], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 110 }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 1300,
          textAlign: "center",
          fontFamily: "Georgia, serif",
          fontSize: 36,
          fontStyle: "italic",
          color: "white",
          textShadow: "0 4px 20px rgba(0,0,0,0.8)",
          padding: "22px 44px",
          background: "rgba(0,0,0,0.35)",
          borderRadius: 12,
        }}
      >
        &quot;{text}&quot;
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Vignette + opening/closing fade
// ---------------------------------------------------------------------------

const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }} />
);

const OpeningCloseFade: React.FC<{ totalDuration: number }> = ({ totalDuration }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 20, totalDuration - 25, totalDuration], [1, 0, 0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return <AbsoluteFill style={{ backgroundColor: "black", opacity }} />;
};

// ---------------------------------------------------------------------------
// Main composition
// ---------------------------------------------------------------------------

export const TurtleEvolution: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {SHOTS.map((shot, i) => {
        if (shot.kind === "graphic") {
          const GraphicComp = GRAPHICS[shot.graphic];
          const durationInFrames = shot.end - shot.start;
          return (
            <Sequence key={i} from={shot.start} durationInFrames={durationInFrames}>
              <GraphicComp durationInFrames={durationInFrames} {...(shot.props ?? {})} />
            </Sequence>
          );
        }
        const half = CROSSFADE / 2;
        const renderFrom = Math.max(0, shot.start - half);
        const renderEnd = Math.min(TURTLE_EVOLUTION_DURATION, shot.end + half);
        const adjustedShot: MediaShot =
          shot.kind === "video"
            ? { ...shot, startFrom: Math.max(0, (shot.startFrom ?? 0) - (shot.start - renderFrom)) }
            : shot;
        return (
          <Sequence key={i} from={renderFrom} durationInFrames={renderEnd - renderFrom}>
            <FootageClip shot={adjustedShot} durationInFrames={renderEnd - renderFrom} />
          </Sequence>
        );
      })}
      <Vignette />
      {CALLOUTS.map((c, i) => (
        <Sequence key={i} from={c.from} durationInFrames={c.duration}>
          {c.kind === "title" && <CalloutTitle title={c.title} subtitle={c.subtitle} durationInFrames={c.duration} />}
          {c.kind === "stat" && <CalloutStat value={c.value} label={c.label} durationInFrames={c.duration} />}
          {c.kind === "quote" && <CalloutQuote text={c.text} durationInFrames={c.duration} />}
        </Sequence>
      ))}
      <Audio src={staticFile("turtle-voiceover.mp3")} />
      <OpeningCloseFade totalDuration={TURTLE_EVOLUTION_DURATION} />
    </AbsoluteFill>
  );
};
