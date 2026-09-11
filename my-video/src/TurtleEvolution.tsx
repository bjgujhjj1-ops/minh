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
// Self-hosted fonts (downloaded once from Google Fonts into public/fonts/)
// rather than @remotion/google-fonts' runtime fetch from fonts.gstatic.com —
// this sandbox's Chrome instance can't validate that host's TLS cert through
// the outbound proxy (net::ERR_CERT_AUTHORITY_INVALID), which made every
// render hang on delayRender() waiting for a font that would never load.
// Self-hosting sidesteps the network entirely. Includes both the "latin" and
// "vietnamese" Google Fonts subsets so the script's diacritics render
// correctly (the vietnamese subset only covers the precomposed diacritic
// glyphs, not base Latin letters — both files are needed together).
const FONT_HEAD = "Anton";
const FONT_BODY = "Inter";

const FontFaces: React.FC = () => (
  <style>{`
    @font-face {
      font-family: 'Anton';
      font-style: normal;
      font-weight: 400;
      src: url('${staticFile("fonts/anton-latin.woff2")}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122;
    }
    @font-face {
      font-family: 'Anton';
      font-style: normal;
      font-weight: 400;
      src: url('${staticFile("fonts/anton-vietnamese.woff2")}') format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 100 900;
      src: url('${staticFile("fonts/inter-latin.woff2")}') format('woff2');
      unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122;
    }
    @font-face {
      font-family: 'Inter';
      font-style: normal;
      font-weight: 100 900;
      src: url('${staticFile("fonts/inter-vietnamese.woff2")}') format('woff2');
      unicode-range: U+0102-0103, U+0110-0111, U+0128-0129, U+0168-0169, U+01A0-01A1, U+01AF-01B0, U+0300-0301, U+0303-0304, U+0308-0309, U+0323, U+0329, U+1EA0-1EF9, U+20AB;
    }
  `}</style>
);

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

const CROSSFADE = 18;
const COLOR_GRADE = "contrast(1.1) saturate(1.1) brightness(1.0)";
const INK = "#f2f2f2";
const ACCENT = "#e8342a"; // bold red — the one standout color, used sparingly for the fact that matters
const GRAPHIC_BG = "#060606";

// Shared SVG defs (gradients + drop shadow) referenced by url(#id) from every
// graphic component below — one definition, reused everywhere, so icons and
// silhouettes read as shaded/lit rather than flat single-color fills.
const SharedSvgDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: "absolute" }}>
    <defs>
      <linearGradient id="steelGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#e2e2e2" />
        <stop offset="55%" stopColor="#9a9a9a" />
        <stop offset="100%" stopColor="#4d4d4d" />
      </linearGradient>
      <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#ff7a6e" />
        <stop offset="55%" stopColor="#e8342a" />
        <stop offset="100%" stopColor="#8f1a12" />
      </linearGradient>
      <linearGradient id="darkRedGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9a4038" />
        <stop offset="100%" stopColor="#4a1613" />
      </linearGradient>
      <filter id="dropShadow" x="-60%" y="-60%" width="220%" height="220%">
        <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.55" />
      </filter>
    </defs>
  </svg>
);

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
  { kind: "graphic", start: 0, end: 211, graphic: "title" },
  { kind: "graphic", start: 211, end: 461, graphic: "citation", props: { source: "Wikipedia — Carcinisation", excerpt: "Carcinisation is a form of convergent evolution in which non-crab crustaceans evolve a crab-like body plan.", highlight: "non-crab crustaceans evolve a crab-like body plan" } },
  { kind: "video", src: "turtle-seaturtle-raw.mp4", startFrom: 0, start: 461, end: 661, motion: M([1.1, 1]) },
  { kind: "graphic", start: 661, end: 843, graphic: "textcard", props: { text: "TẠI SAO LÀ... RÙA?" } },
  { kind: "video", src: "turtle-bird-raw.mp4", startFrom: 0, start: 843, end: 1028, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-cheetah-raw.mp4", startFrom: 0, start: 1028, end: 1213, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 0, start: 1213, end: 1399, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-beetle-raw.mp4", startFrom: 0, start: 1399, end: 1585, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-tortoise2-raw.mp4", startFrom: 0, start: 1585, end: 1809, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-shelltexture-raw.mp4", startFrom: 0, start: 1809, end: 2033, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-fossil3-raw.mp4", startFrom: 0, start: 2033, end: 2257, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-ribcage-raw.mp4", startFrom: 0, start: 2257, end: 2481, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise3-raw.mp4", startFrom: 0, start: 2481, end: 2704, motion: M([1.1, 1]) },
  { kind: "graphic", start: 2704, end: 3004, graphic: "deeptime" },
  { kind: "video", src: "turtle-desert-raw.mp4", startFrom: 0, start: 3004, end: 3213, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-henodus.jpg", start: 3213, end: 3434, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-henodus.jpg", start: 3434, end: 3655, motion: M([1.15, 1.3], { x: [4, -4] }) },
  { kind: "video", src: "turtle-swamp-raw.mp4", startFrom: 0, start: 3655, end: 3876, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-lagoon-raw.mp4", startFrom: 0, start: 3876, end: 4097, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-oceanfloor-raw.mp4", startFrom: 0, start: 4097, end: 4318, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-crab-raw.mp4", startFrom: 0, start: 4318, end: 4484, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 186, start: 4484, end: 4650, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-beetle-raw.mp4", startFrom: 0, start: 4650, end: 4815, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-snail-raw.mp4", startFrom: 0, start: 4815, end: 4980, motion: M([1.1, 1]) },
  { kind: "image", src: "turtle-eunotosaurus.jpg", start: 4980, end: 5260, motion: M([1, 1.12]) },
  { kind: "graphic", start: 5260, end: 5714, graphic: "citation", props: { source: "Sci-News.com — Paleontology", excerpt: "The earliest beginnings of the turtle shell was not for protection but rather for digging underground to escape the harsh South African environment where these early proto turtles lived, said lead author Dr. Tyler Lyson.", highlight: "was not for protection but rather for digging underground" } },
  { kind: "video", src: "turtle-desert-raw.mp4", startFrom: 209, start: 5714, end: 6034, motion: M([1.1, 1]) },
  { kind: "image", src: "turtle-glyptodon.jpg", start: 6034, end: 6260, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-icefield-raw.mp4", startFrom: 0, start: 6260, end: 6486, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-predator-raw.mp4", startFrom: 0, start: 6486, end: 6712, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-cheetah-raw.mp4", startFrom: 185, start: 6712, end: 6937, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-bird-raw.mp4", startFrom: 185, start: 6937, end: 7161, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-cyamodus.jpg", start: 7161, end: 7357, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-oceanfloor-raw.mp4", startFrom: 221, start: 7357, end: 7553, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-lagoon-raw.mp4", startFrom: 0, start: 7553, end: 7750, motion: M([1, 1.12]) },
  { kind: "graphic", start: 7750, end: 8200, graphic: "citation", props: { source: "RIKEN — Research News", excerpt: "Turtle morphology poses a unique puzzle in that the turtle\u2019s scapulae (shoulder blades), situated outside the ribs in other animals, are found inside its shell.", highlight: "situated outside the ribs in other animals, are found inside its shell" } },
  { kind: "video", src: "turtle-ribcage-raw.mp4", startFrom: 0, start: 8200, end: 8411, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-fossilrock-raw.mp4", startFrom: 0, start: 8411, end: 8622, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise3-raw.mp4", startFrom: 223, start: 8622, end: 8836, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 352, start: 8836, end: 9050, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-ribcage-raw.mp4", startFrom: 0, start: 9050, end: 9264, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-oceanfloor-raw.mp4", startFrom: 0, start: 9264, end: 9478, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-shelltexture-raw.mp4", startFrom: 224, start: 9478, end: 9691, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-tortoise-long-raw.mp4", startFrom: 0, start: 9691, end: 9881, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise2-raw.mp4", startFrom: 224, start: 9881, end: 10071, motion: M([1.1, 1]) },
  { kind: "graphic", start: 10071, end: 10261, graphic: "textcard", props: { text: "SỐNG CHẬM • THỌ LÂU" } },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 0, start: 10261, end: 10454, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-ladybug-raw.mp4", startFrom: 0, start: 10454, end: 10619, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-beetle-raw.mp4", startFrom: 0, start: 10619, end: 10784, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-snail-raw.mp4", startFrom: 165, start: 10784, end: 10949, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-crab-raw.mp4", startFrom: 166, start: 10949, end: 11115, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-seaturtle2-raw.mp4", startFrom: 0, start: 11115, end: 11335, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-seaturtle3-raw.mp4", startFrom: 0, start: 11335, end: 11555, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise2-raw.mp4", startFrom: 414, start: 11555, end: 11775, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise3-raw.mp4", startFrom: 437, start: 11775, end: 11995, motion: M([1.1, 1]) },
  { kind: "graphic", start: 11995, end: 12295, graphic: "deeptime500" },
  { kind: "video", src: "turtle-space2-raw.mp4", startFrom: 0, start: 12295, end: 12495, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-space3-raw.mp4", startFrom: 0, start: 12495, end: 12693, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-space-long-raw.mp4", startFrom: 0, start: 12693, end: 12917, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-archelon.jpg", start: 12917, end: 13141, motion: M([1.1, 1.25]) },
  { kind: "video", src: "turtle-rainforest-raw.mp4", startFrom: 0, start: 13141, end: 13365, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-lagoon-raw.mp4", startFrom: 0, start: 13365, end: 13589, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-oceanfloor-raw.mp4", startFrom: 214, start: 13589, end: 13812, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-space2-raw.mp4", startFrom: 200, start: 13812, end: 14001, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-icefield-raw.mp4", startFrom: 226, start: 14001, end: 14190, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-bird-raw.mp4", startFrom: 409, start: 14190, end: 14379, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-coral-raw.mp4", startFrom: 0, start: 14379, end: 14532, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-snail-raw.mp4", startFrom: 330, start: 14532, end: 14685, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-shelltexture-raw.mp4", startFrom: 437, start: 14685, end: 14837, motion: M([1, 1.12]) },
  { kind: "graphic", start: 14837, end: 15099, graphic: "outrocta" },
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
  { from: 863, duration: 140, kind: "stat", value: "ĐÔI CÁNH", label: "LỰA CHỌN 1" },
  { from: 1048, duration: 140, kind: "stat", value: "TỐC ĐỘ PHI MÃ", label: "LỰA CHỌN 2" },
  { from: 1233, duration: 150, kind: "stat", value: "BỘ GIÁP", label: "TỰ NHIÊN ĐÃ CHỌN PHƯƠNG ÁN NÀY" },
  { from: 1829, duration: 180, kind: "title", title: "Mai Rùa", subtitle: "XƯƠNG SƯỜN + CỘT SỐNG HỢP NHẤT" },
  { from: 3233, duration: 170, kind: "title", title: "Henodus", subtitle: "PLACODONT — TRIAS, ~230 TRIỆU NĂM TRƯỚC" },
  { from: 3454, duration: 170, kind: "stat", value: "GIẢI PHÁP TỐI ƯU", label: "CHO LỐI SỐNG ĐẦM PHÁ NÔNG" },
  { from: 4338, duration: 130, kind: "title", title: "Pháo Đài Di Động", subtitle: "CHIẾN LƯỢC SINH TỒN" },
  { from: 5000, duration: 170, kind: "title", title: "Eunotosaurus", subtitle: "MỘT TRONG NHỮNG TỔ TIÊN SỚM NHẤT" },
  { from: 6054, duration: 170, kind: "title", title: "Glyptodon", subtitle: "THÚ CÓ VÚ MANG HÌNH RÙA" },
  { from: 6506, duration: 170, kind: "stat", value: "KỶ BĂNG HÀ", label: "CHIM ĂN THỊT KHỔNG LỒ • HỔ RĂNG KIẾM" },
  { from: 7181, duration: 150, kind: "title", title: "Cyamodus", subtitle: "HAI LỚP MAI RIÊNG BIỆT" },
  { from: 9070, duration: 170, kind: "stat", value: "KHÔNG CƠ HOÀNH", label: "PHẢI DÙNG CƠ BỤNG ĐỂ THỞ" },
  { from: 9498, duration: 170, kind: "stat", value: "KHỐI NHIỆT KHỔNG LỒ", label: "MAI LỚN NÓNG/NGUỘI RẤT CHẬM" },
  { from: 10474, duration: 130, kind: "title", title: "Bọ Rùa", subtitle: "CÁNH CỨNG CHE PHỦ TOÀN THÂN" },
  { from: 11135, duration: 170, kind: "stat", value: "MAI DẸT", label: "GIẢM LỰC CẢN CỦA NƯỚC" },
  { from: 11575, duration: 170, kind: "stat", value: "MAI VÒM", label: "CHỐNG LỰC CẮN CỦA THÚ DỮ" },
  { from: 12947, duration: 170, kind: "quote", text: "Chậm mà chắc, bảo thủ nhưng bất diệt." },
  { from: 13832, duration: 150, kind: "stat", value: "Ở HÀNH TINH KHÁC?", label: "NẾU CÓ SỰ SỐNG, CÓ THỂ CŨNG CÓ “RÙA”" },
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
            stroke="url(#steelGrad)"
            strokeWidth={10}
            strokeLinecap="round"
            opacity={0.85}
          />
        </svg>
        <div style={{ textAlign: "center", transform: `scale(${titleScale})`, marginTop: 60 }}>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 900, fontSize: 104, color: INK, letterSpacing: 4 }}>
            RÙA HÓA
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: FONT_BODY,
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
            fontFamily: FONT_HEAD,
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
// Graphic: deep-time card (reusable big-number stat, e.g. "230 TRIỆU NĂM")
// ---------------------------------------------------------------------------

const GraphicDeepTime: React.FC<{ durationInFrames: number; value: string; label: string }> = ({
  durationInFrames,
  value,
  label,
}) => {
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
          <text x={1550} y={100} fill={INK} fontSize={20} fontFamily={FONT_BODY} textAnchor="end" opacity={0.7}>
            HIỆN TẠI
          </text>
          <text x={200} y={100} fill={INK} fontSize={20} fontFamily={FONT_BODY} textAnchor="start" opacity={0.7}>
            QUÁ KHỨ
          </text>
          <circle cx={markerX} cy={60} r={16} fill="url(#redGrad)" filter="url(#dropShadow)" />
        </svg>
        <div style={{ textAlign: "center", transform: `scale(${numberScale})` }}>
          <div
            style={{
              fontFamily: FONT_HEAD,
              fontSize: 96,
              color: "white",
              WebkitTextStroke: "3px black",
              textShadow: "0 0 30px rgba(255,255,255,0.5), 0 6px 14px rgba(0,0,0,0.8)",
            }}
          >
            {value}
          </div>
          <div
            style={{
              fontFamily: FONT_BODY,
              fontWeight: 800,
              fontSize: 26,
              color: ACCENT,
              WebkitTextStroke: "1px black",
              letterSpacing: 3,
              marginTop: 12,
            }}
          >
            {label}
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

const GraphicCitation: React.FC<{
  durationInFrames: number;
  source: string;
  excerpt: string;
  highlight: string;
}> = ({ durationInFrames, source, excerpt, highlight }) => {
  const frame = useCurrentFrame();
  const sweep = interpolate(frame, [25, 95], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cardScale = interpolate(frame, [0, 20], [0.94, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });

  const idx = excerpt.indexOf(highlight);
  const before = idx >= 0 ? excerpt.slice(0, idx) : excerpt;
  const mid = idx >= 0 ? excerpt.slice(idx, idx + highlight.length) : "";
  const after = idx >= 0 ? excerpt.slice(idx + highlight.length) : "";

  return (
    <GraphicFade durationInFrames={durationInFrames}>
      <AbsoluteFill style={{ background: GRAPHIC_BG, justifyContent: "center", alignItems: "center" }}>
        <div
          style={{
            transform: `scale(${cardScale})`,
            width: 1120,
            background: "white",
            borderRadius: 6,
            padding: "52px 58px 34px",
            boxShadow: "0 30px 90px rgba(0,0,0,0.65)",
          }}
        >
          <div style={{ fontFamily: "Georgia, serif", fontSize: 29, lineHeight: 1.65, color: "#161616" }}>
            {before}
            <span style={{ background: `linear-gradient(90deg, #ffe066 ${sweep}%, transparent ${sweep}%)` }}>{mid}</span>
            {after}
          </div>
          <div
            style={{
              marginTop: 24,
              borderTop: "1px solid #e2e2e2",
              paddingTop: 12,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <div style={{ fontFamily: FONT_BODY, fontSize: 15, color: "#8a8a8a", fontStyle: "italic" }}>Nguồn: {source}</div>
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
            <circle r={55} fill="url(#redGrad)" filter="url(#dropShadow)" />
            <path d="M-18,10 L-18,-10 L0,-30 Q10,-30 8,-16 L20,-16 Q30,-16 28,-4 L22,10 Q18,20 6,20 L-18,20 Z" fill="#1a2a2e" />
          </svg>
          <div style={{ fontFamily: FONT_HEAD, fontWeight: 800, fontSize: 36, color: INK, letterSpacing: 2 }}>
            LIKE • SUBSCRIBE
          </div>
        </div>
      </AbsoluteFill>
    </GraphicFade>
  );
};

const GraphicDeepTime230: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => (
  <GraphicDeepTime durationInFrames={durationInFrames} value="230 TRIỆU NĂM" label="KỶ TRIAS — SỰ BÙNG NỔ HÌNH THÁI BÒ SÁT" />
);

const GraphicDeepTime500: React.FC<{ durationInFrames: number }> = ({ durationInFrames }) => (
  <GraphicDeepTime durationInFrames={durationInFrames} value="500 TRIỆU NĂM" label="LỊCH SỬ TIẾN HÓA CỦA SỰ SỐNG TRÊN TRÁI ĐẤT" />
);

const GRAPHICS: Record<string, React.FC<{ durationInFrames: number; [key: string]: unknown }>> = {
  title: GraphicTitle,
  textcard: GraphicTextCard as React.FC<{ durationInFrames: number; [key: string]: unknown }>,
  deeptime: GraphicDeepTime230,
  deeptime500: GraphicDeepTime500,
  citation: GraphicCitation as unknown as React.FC<{ durationInFrames: number; [key: string]: unknown }>,
  outrocta: GraphicOutroCta,
};

// ---------------------------------------------------------------------------
// Callout overlays
// ---------------------------------------------------------------------------

const CalloutTitle: React.FC<{ title: string; subtitle: string; durationInFrames: number }> = ({
  title,
  subtitle,
  durationInFrames,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [0, 20], [0.9, 1], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 130 }}>
      <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center" }}>
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 60,
            color: "white",
            WebkitTextStroke: "3px black",
            textShadow: "0 0 26px rgba(255,255,255,0.55), 0 6px 12px rgba(0,0,0,0.85)",
            textTransform: "uppercase",
          }}
        >
          {title}
        </div>
        {subtitle ? (
          <div
            style={{
              marginTop: 10,
              fontFamily: FONT_BODY,
              fontWeight: 800,
              fontSize: 22,
              color: ACCENT,
              WebkitTextStroke: "1.5px black",
              letterSpacing: 2,
            }}
          >
            {subtitle}
          </div>
        ) : null}
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
  const y = interpolate(frame, [0, 20], [24, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-start", padding: "0 0 130px 90px" }}>
      <div style={{ opacity, transform: `translateY(${y}px)` }}>
        <div
          style={{
            fontFamily: FONT_HEAD,
            fontSize: 54,
            color: "white",
            WebkitTextStroke: "3px black",
            textShadow: "0 0 26px rgba(255,255,255,0.55), 0 6px 12px rgba(0,0,0,0.85)",
            textTransform: "uppercase",
          }}
        >
          {value}
        </div>
        <div
          style={{
            marginTop: 6,
            fontFamily: FONT_BODY,
            fontWeight: 800,
            fontSize: 21,
            color: ACCENT,
            WebkitTextStroke: "1px black",
            letterSpacing: 1,
            maxWidth: 720,
          }}
        >
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
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 120 }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          maxWidth: 1300,
          textAlign: "center",
          fontFamily: FONT_BODY,
          fontStyle: "italic",
          fontWeight: 700,
          fontSize: 34,
          color: "white",
          WebkitTextStroke: "2px black",
          textShadow: "0 0 22px rgba(255,255,255,0.5), 0 6px 12px rgba(0,0,0,0.85)",
        }}
      >
        &quot;{text}&quot;
      </div>
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// Vignette + opening/closing fade// ---------------------------------------------------------------------------
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
      <FontFaces />
      <SharedSvgDefs />
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
