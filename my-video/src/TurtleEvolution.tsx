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
  { kind: "graphic", start: 0, end: 202, graphic: "title" },
  { kind: "graphic", start: 202, end: 441, graphic: "citation", props: { source: "Wikipedia — Carcinisation", excerpt: "Carcinisation is a form of convergent evolution in which non-crab crustaceans evolve a crab-like body plan.", highlight: "non-crab crustaceans evolve a crab-like body plan" } },
  { kind: "video", src: "turtle-seaturtle-raw.mp4", startFrom: 0, start: 441, end: 633, motion: M([1.1, 1]) },
  { kind: "graphic", start: 633, end: 807, graphic: "textcard", props: { text: "TẠI SAO LÀ... RÙA?" } },
  { kind: "video", src: "turtle-bird-raw.mp4", startFrom: 0, start: 807, end: 1003, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-cheetah-raw.mp4", startFrom: 0, start: 1003, end: 1199, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 0, start: 1199, end: 1397, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-beetle-raw.mp4", startFrom: 0, start: 1397, end: 1594, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-tortoise2-raw.mp4", startFrom: 0, start: 1594, end: 1813, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-shelltexture-raw.mp4", startFrom: 0, start: 1813, end: 2032, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-fossil3-raw.mp4", startFrom: 0, start: 2032, end: 2252, motion: M([1.1, 1]) },
  { kind: "image", src: "turtle-skeleton-crosssection.jpg", start: 2252, end: 2471, motion: M([1, 1.12], { x: [0, -3] }) },
  { kind: "video", src: "turtle-tortoise3-raw.mp4", startFrom: 0, start: 2471, end: 2689, motion: M([1.1, 1]) },
  { kind: "graphic", start: 2689, end: 3013, graphic: "deeptime" },
  { kind: "video", src: "turtle-desert-raw.mp4", startFrom: 0, start: 3013, end: 3238, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-henodus.jpg", start: 3238, end: 3465, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-henodus.jpg", start: 3465, end: 3692, motion: M([1.15, 1.3], { x: [4, -4] }) },
  { kind: "video", src: "turtle-swamp-raw.mp4", startFrom: 0, start: 3692, end: 3918, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-lagoon-raw.mp4", startFrom: 0, start: 3918, end: 4145, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-oceanfloor-raw.mp4", startFrom: 0, start: 4145, end: 4372, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-crab-raw.mp4", startFrom: 0, start: 4372, end: 4541, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-armadillo2-raw.mp4", startFrom: 20, start: 4541, end: 4709, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-beetle-raw.mp4", startFrom: 0, start: 4709, end: 4877, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-snail-raw.mp4", startFrom: 0, start: 4877, end: 5044, motion: M([1.1, 1]) },
  { kind: "image", src: "turtle-eunotosaurus.jpg", start: 5044, end: 5317, motion: M([1, 1.12]) },
  { kind: "graphic", start: 5317, end: 5759, graphic: "citation", props: { source: "Sci-News.com — Paleontology", excerpt: "The earliest beginnings of the turtle shell was not for protection but rather for digging underground to escape the harsh South African environment where these early proto turtles lived, said lead author Dr. Tyler Lyson.", highlight: "was not for protection but rather for digging underground" } },
  { kind: "image", src: "turtle-eunotosaurus-atuchin.jpg", start: 5759, end: 6071, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-glyptodon.jpg", start: 6071, end: 6309, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-icefield-raw.mp4", startFrom: 0, start: 6309, end: 6547, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-predator-raw.mp4", startFrom: 0, start: 6547, end: 6784, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-cheetah-raw.mp4", startFrom: 185, start: 6784, end: 7021, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-bird-raw.mp4", startFrom: 185, start: 7021, end: 7257, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-cyamodus.jpg", start: 7257, end: 7462, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-oceanfloor2-raw.mp4", startFrom: 0, start: 7462, end: 7667, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-lagoon-raw.mp4", startFrom: 0, start: 7667, end: 7873, motion: M([1, 1.12]) },
  { kind: "graphic", start: 7873, end: 8311, graphic: "citation", props: { source: "RIKEN — Research News", excerpt: "Turtle morphology poses a unique puzzle in that the turtle\u2019s scapulae (shoulder blades), situated outside the ribs in other animals, are found inside its shell.", highlight: "situated outside the ribs in other animals, are found inside its shell" } },
  { kind: "image", src: "turtle-skeleton-crosssection.jpg", start: 8311, end: 8517, motion: M([1.15, 1], { x: [-3, 0] }) },
  { kind: "video", src: "turtle-fossilrock-raw.mp4", startFrom: 0, start: 8517, end: 8722, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise3-raw.mp4", startFrom: 223, start: 8722, end: 8932, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-armadillo-raw.mp4", startFrom: 352, start: 8932, end: 9141, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-skeleton-crosssection.jpg", start: 9141, end: 9351, motion: M([1, 1.15], { y: [0, -2] }) },
  { kind: "video", src: "turtle-oceanfloor-raw.mp4", startFrom: 0, start: 9351, end: 9560, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-shelltexture-raw.mp4", startFrom: 224, start: 9560, end: 9769, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-tortoise-long-raw.mp4", startFrom: 0, start: 9769, end: 9956, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise2-raw.mp4", startFrom: 224, start: 9956, end: 10143, motion: M([1.1, 1]) },
  { kind: "graphic", start: 10143, end: 10330, graphic: "textcard", props: { text: "SỐNG CHẬM • THỌ LÂU" } },
  { kind: "video", src: "turtle-armadillo2-raw.mp4", startFrom: 250, start: 10330, end: 10520, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-ladybug-raw.mp4", startFrom: 0, start: 10520, end: 10690, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-beetle-raw.mp4", startFrom: 0, start: 10690, end: 10859, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-snail-raw.mp4", startFrom: 165, start: 10859, end: 11029, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-crab-raw.mp4", startFrom: 166, start: 11029, end: 11200, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-seaturtle2-raw.mp4", startFrom: 0, start: 11200, end: 11418, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-seaturtle3-raw.mp4", startFrom: 0, start: 11418, end: 11635, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise2-raw.mp4", startFrom: 414, start: 11635, end: 11852, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-tortoise3-raw.mp4", startFrom: 437, start: 11852, end: 12070, motion: M([1.1, 1]) },
  { kind: "graphic", start: 12070, end: 12362, graphic: "deeptime500" },
  { kind: "video", src: "turtle-space2-raw.mp4", startFrom: 0, start: 12362, end: 12557, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-space3-raw.mp4", startFrom: 0, start: 12557, end: 12750, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-space-long-raw.mp4", startFrom: 0, start: 12750, end: 12976, motion: M([1, 1.12]) },
  { kind: "image", src: "turtle-archelon.jpg", start: 12976, end: 13202, motion: M([1.1, 1.25]) },
  { kind: "video", src: "turtle-rainforest-raw.mp4", startFrom: 0, start: 13202, end: 13427, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-lagoon-raw.mp4", startFrom: 0, start: 13427, end: 13653, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-oceanfloor2-raw.mp4", startFrom: 100, start: 13653, end: 13878, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-space2-raw.mp4", startFrom: 200, start: 13878, end: 14067, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-icefield-raw.mp4", startFrom: 226, start: 14067, end: 14257, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-bird-raw.mp4", startFrom: 409, start: 14257, end: 14446, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-coral-raw.mp4", startFrom: 0, start: 14446, end: 14604, motion: M([1, 1.12]) },
  { kind: "video", src: "turtle-snail-raw.mp4", startFrom: 330, start: 14604, end: 14763, motion: M([1.1, 1]) },
  { kind: "video", src: "turtle-shelltexture-raw.mp4", startFrom: 437, start: 14763, end: 14920, motion: M([1, 1.12]) },
  { kind: "graphic", start: 14920, end: 15193, graphic: "outrocta" },
];

export const TURTLE_EVOLUTION_DURATION = SHOTS[SHOTS.length - 1].end;

// ---------------------------------------------------------------------------
// Call-out text overlays (layered on top of media shots)
// ---------------------------------------------------------------------------

type Callout =
  | { from: number; duration: number; kind: "title"; title: string; subtitle: string }
  | { from: number; duration: number; kind: "stat"; value: string; label: string }
  | { from: number; duration: number; kind: "quote"; text: string }
  | { from: number; duration: number; kind: "credit"; text: string }
  | {
      from: number;
      duration: number;
      kind: "pointer";
      fromXPct: number;
      fromYPct: number;
      toXPct: number;
      toYPct: number;
      label: string;
    };

const CALLOUTS: Callout[] = [
  { from: 828, duration: 148, kind: "stat", value: "ĐÔI CÁNH", label: "LỰA CHỌN 1" },
  { from: 1024, duration: 148, kind: "stat", value: "TỐC ĐỘ PHI MÃ", label: "LỰA CHỌN 2" },
  { from: 1221, duration: 159, kind: "stat", value: "BỘ GIÁP", label: "TỰ NHIÊN ĐÃ CHỌN PHƯƠNG ÁN NÀY" },
  { from: 1833, duration: 176, kind: "title", title: "Mai Rùa", subtitle: "XƯƠNG SƯỜN + CỘT SỐNG HỢP NHẤT" },
  {
    from: 2264,
    duration: 196,
    kind: "pointer",
    fromXPct: 66,
    fromYPct: 10,
    toXPct: 17,
    toYPct: 14,
    label: "XƯƠNG SƯỜN MỞ RỘNG",
  },
  { from: 2264, duration: 196, kind: "credit", text: "Tiêu bản: Bảo tàng Lịch sử Tự nhiên London — Peter Taylor (CC BY 2.0)" },
  { from: 3259, duration: 174, kind: "title", title: "Henodus", subtitle: "PLACODONT — TRIAS, ~230 TRIỆU NĂM TRƯỚC" },
  { from: 3485, duration: 174, kind: "stat", value: "GIẢI PHÁP TỐI ƯU", label: "CHO LỐI SỐNG ĐẦM PHÁ NÔNG" },
  { from: 4392, duration: 132, kind: "title", title: "Pháo Đài Di Động", subtitle: "CHIẾN LƯỢC SINH TỒN" },
  { from: 5063, duration: 166, kind: "title", title: "Eunotosaurus", subtitle: "MỘT TRONG NHỮNG TỔ TIÊN SỚM NHẤT" },
  { from: 5759, duration: 312, kind: "credit", text: "Minh họa: Andrey Atuchin / Sci-News.com" },
  { from: 6092, duration: 179, kind: "title", title: "Glyptodon", subtitle: "THÚ CÓ VÚ MANG HÌNH RÙA" },
  { from: 6568, duration: 179, kind: "stat", value: "KỶ BĂNG HÀ", label: "CHIM ĂN THỊT KHỔNG LỒ • HỔ RĂNG KIẾM" },
  { from: 7278, duration: 157, kind: "title", title: "Cyamodus", subtitle: "HAI LỚP MAI RIÊNG BIỆT" },
  {
    from: 8324,
    duration: 185,
    kind: "pointer",
    fromXPct: 40,
    fromYPct: 78,
    toXPct: 11,
    toYPct: 55,
    label: "XƯƠNG BẢ VAI ẨN BÊN TRONG",
  },
  { from: 8324, duration: 185, kind: "credit", text: "Tiêu bản: Bảo tàng Lịch sử Tự nhiên London — Peter Taylor (CC BY 2.0)" },
  { from: 9161, duration: 167, kind: "stat", value: "KHÔNG CƠ HOÀNH", label: "PHẢI DÙNG CƠ BỤNG ĐỂ THỞ" },
  {
    from: 9154,
    duration: 186,
    kind: "pointer",
    fromXPct: 68,
    fromYPct: 8,
    toXPct: 17,
    toYPct: 12,
    label: "LỒNG NGỰC LÀ MỘT KHỐI CỨNG",
  },
  { from: 9154, duration: 186, kind: "credit", text: "Tiêu bản: Bảo tàng Lịch sử Tự nhiên London — Peter Taylor (CC BY 2.0)" },
  { from: 9580, duration: 167, kind: "stat", value: "KHỐI NHIỆT KHỔNG LỒ", label: "MAI LỚN NÓNG/NGUỘI RẤT CHẬM" },
  { from: 10541, duration: 134, kind: "title", title: "Bọ Rùa", subtitle: "CÁNH CỨNG CHE PHỦ TOÀN THÂN" },
  { from: 11220, duration: 168, kind: "stat", value: "MAI DẸT", label: "GIẢM LỰC CẢN CỦA NƯỚC" },
  { from: 11655, duration: 168, kind: "stat", value: "MAI VÒM", label: "CHỐNG LỰC CẮN CỦA THÚ DỮ" },
  { from: 13006, duration: 171, kind: "quote", text: "Chậm mà chắc, bảo thủ nhưng bất diệt." },
  { from: 13898, duration: 150, kind: "stat", value: "Ở HÀNH TINH KHÁC?", label: "NẾU CÓ SỰ SỐNG, CÓ THỂ CŨNG CÓ “RÙA”" },
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

const CalloutCredit: React.FC<{ text: string; durationInFrames: number }> = ({ text, durationInFrames }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15, durationInFrames - 15, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "flex-end", padding: "0 28px 22px 0" }}>
      <div
        style={{
          opacity,
          fontFamily: FONT_BODY,
          fontWeight: 600,
          fontSize: 15,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.85)",
          textShadow: "0 2px 6px rgba(0,0,0,0.9)",
        }}
      >
        {text}
      </div>
    </AbsoluteFill>
  );
};

const CalloutPointer: React.FC<{
  fromXPct: number;
  fromYPct: number;
  toXPct: number;
  toYPct: number;
  label: string;
  durationInFrames: number;
}> = ({ fromXPct, fromYPct, toXPct, toYPct, label, durationInFrames }) => {
  const frame = useCurrentFrame();
  const fade = interpolate(frame, [0, 12, durationInFrames - 18, durationInFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const draw = interpolate(frame, [4, 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });
  const pop = interpolate(frame, [0, 16], [0.7, 1], {
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.back(1.7)),
  });
  const breathe = 1 + Math.sin(frame / 14) * 0.03;

  const x1 = (fromXPct / 100) * 1920;
  const y1 = (fromYPct / 100) * 1080;
  const x2 = (toXPct / 100) * 1920;
  const y2 = (toYPct / 100) * 1080;
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const curveAmount = len * 0.18;
  const cx = mx - (dy / len) * curveAmount;
  const cy = my + (dx / len) * curveAmount;

  const bez = (t: number): [number, number] => {
    const px = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
    const py = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
    return [px, py];
  };
  const [hx, hy] = bez(Math.min(draw, 1));
  const [tx, ty] = bez(Math.max(0, Math.min(draw, 1) - 0.04));
  const angle = Math.atan2(hy - ty, hx - tx) * (180 / Math.PI);

  const steps = 24;
  let d = `M ${x1} ${y1} `;
  for (let i = 1; i <= steps; i++) {
    const t = (i / steps) * draw;
    const [px, py] = bez(t);
    d += `L ${px} ${py} `;
  }

  return (
    <AbsoluteFill style={{ opacity: fade }}>
      <svg width={1920} height={1080} style={{ position: "absolute", inset: 0 }}>
        <path d={d} fill="none" stroke="black" strokeWidth={14} strokeLinecap="round" opacity={0.35} filter="url(#dropShadow)" />
        <path d={d} fill="none" stroke="url(#redGrad)" strokeWidth={7} strokeLinecap="round" />
        <g transform={`translate(${hx}, ${hy}) rotate(${angle})`}>
          <path d="M 0 0 L -26 -12 L -18 0 L -26 12 Z" fill="url(#redGrad)" stroke="black" strokeWidth={2} strokeLinejoin="round" />
        </g>
        <circle cx={x1} cy={y1} r={10} fill="white" stroke={ACCENT} strokeWidth={4} />
        <circle cx={x1} cy={y1} r={4} fill={ACCENT} />
      </svg>
      <div
        style={{
          position: "absolute",
          left: x1,
          top: y1,
          transform: `translate(-50%, -160%) scale(${pop * breathe})`,
          background: "rgba(6,6,6,0.72)",
          border: "1px solid rgba(255,255,255,0.18)",
          borderRadius: 8,
          padding: "8px 16px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontFamily: FONT_BODY, fontWeight: 800, fontSize: 22, color: "white", letterSpacing: 1 }}>{label}</span>
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
// Sparse sound-effect accents — a handful of cues only, never wall-to-wall.
// ---------------------------------------------------------------------------

type SfxCue = { at: number; src: string; volume: number; durationInFrames: number };

const SFX_CUES: SfxCue[] = [
  { at: 0, src: "sfx-whoosh.mp3", volume: 0.45, durationInFrames: 50 },
  { at: 202, src: "sfx-camera.mp3", volume: 0.4, durationInFrames: 45 },
  { at: 633, src: "sfx-whoosh.mp3", volume: 0.35, durationInFrames: 50 },
  { at: 1793, src: "sfx-riser.mp3", volume: 0.22, durationInFrames: 60 },
  { at: 2689, src: "sfx-braam.mp3", volume: 0.32, durationInFrames: 90 },
  { at: 3259, src: "sfx-hit.mp3", volume: 0.3, durationInFrames: 45 },
  { at: 5023, src: "sfx-riser.mp3", volume: 0.22, durationInFrames: 60 },
  { at: 5317, src: "sfx-camera.mp3", volume: 0.4, durationInFrames: 45 },
  { at: 6092, src: "sfx-hit.mp3", volume: 0.3, durationInFrames: 45 },
  { at: 7238, src: "sfx-riser.mp3", volume: 0.22, durationInFrames: 60 },
  { at: 7873, src: "sfx-camera.mp3", volume: 0.4, durationInFrames: 45 },
  { at: 10143, src: "sfx-whoosh.mp3", volume: 0.35, durationInFrames: 50 },
  { at: 10541, src: "sfx-hit.mp3", volume: 0.3, durationInFrames: 45 },
  { at: 12070, src: "sfx-braam.mp3", volume: 0.32, durationInFrames: 90 },
  { at: 14920, src: "sfx-whoosh.mp3", volume: 0.4, durationInFrames: 50 },
];

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
          {c.kind === "credit" && <CalloutCredit text={c.text} durationInFrames={c.duration} />}
          {c.kind === "pointer" && (
            <CalloutPointer
              fromXPct={c.fromXPct}
              fromYPct={c.fromYPct}
              toXPct={c.toXPct}
              toYPct={c.toYPct}
              label={c.label}
              durationInFrames={c.duration}
            />
          )}
        </Sequence>
      ))}
      <Audio src={staticFile("turtle-voiceover.mp3")} />
      {SFX_CUES.map((cue, i) => (
        <Sequence key={i} from={cue.at} durationInFrames={cue.durationInFrames}>
          <Audio src={staticFile(cue.src)} volume={cue.volume} />
        </Sequence>
      ))}
      <OpeningCloseFade totalDuration={TURTLE_EVOLUTION_DURATION} />
    </AbsoluteFill>
  );
};
