/**
 * Motion-graphics layer for hero sections.
 * Two slow-drifting light fields (gold + seaglass), a set of gold contour lines that
 * creep like a tide chart, and a whisper of film grain. Everything is CSS-driven so it
 * runs off the main thread, and it all freezes under prefers-reduced-motion.
 *
 * `subtle` dials it down for use over video, where it should only add a little life
 * without competing with the footage.
 */
const CONTOURS = [
    "M-40 120 C 180 60, 320 200, 560 130 S 900 40, 1140 150 S 1400 90, 1500 120",
    "M-40 200 C 200 150, 340 290, 600 210 S 940 120, 1180 240 S 1420 180, 1500 210",
    "M-40 290 C 220 240, 380 380, 640 300 S 980 220, 1220 330 S 1440 260, 1500 300",
    "M-40 380 C 240 340, 420 470, 680 390 S 1020 310, 1260 420 S 1460 350, 1500 390",
    "M-40 470 C 260 430, 460 560, 720 480 S 1060 400, 1300 510 S 1480 440, 1500 480",
    "M-40 560 C 280 520, 500 650, 760 570 S 1100 490, 1340 600 S 1500 530, 1500 570",
];

const GRAIN =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.6 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export default function HeroAtmosphere({ subtle = false }) {
    const blobOpacity = subtle ? "opacity-[0.28]" : "opacity-100";
    const lineOpacity = subtle ? 0.05 : 0.11;
    return (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true" data-testid="hero-atmosphere">
            {/* light fields */}
            <div className={`absolute inset-0 ${blobOpacity}`}>
                <div className="absolute -top-1/3 -left-1/4 w-[70vw] h-[70vw] max-w-[900px] max-h-[900px] rounded-full bg-gold/[0.13] blur-[110px] animate-drift-a" />
                <div className="absolute -bottom-1/2 right-[-10%] w-[60vw] h-[60vw] max-w-[820px] max-h-[820px] rounded-full bg-seaglass/[0.28] blur-[120px] animate-drift-b" />
            </div>

            {/* contour lines */}
            <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 1460 680"
                preserveAspectRatio="xMidYMid slice"
                fill="none"
            >
                {CONTOURS.map((d, i) => (
                    <path
                        key={i}
                        d={d}
                        stroke="#C5A059"
                        strokeOpacity={lineOpacity}
                        strokeWidth={1}
                        strokeDasharray="14 10"
                        className="animate-contour"
                        style={{ animationDuration: `${52 + i * 9}s`, animationDirection: i % 2 ? "reverse" : "normal" }}
                    />
                ))}
            </svg>

            {/* grain */}
            <div className="absolute inset-0 mix-blend-soft-light opacity-[0.35]" style={{ backgroundImage: GRAIN }} />
        </div>
    );
}
