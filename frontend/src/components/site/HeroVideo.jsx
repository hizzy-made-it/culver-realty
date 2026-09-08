import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";

/**
 * Ambient background video for hero sections.
 * - `src` is a path WITHOUT extension; `${src}.mp4` and `${src}-mobile.mp4` are expected.
 * - Poster paints instantly; the video cross-fades in once it can play.
 * - Reduced-motion users (and browsers that refuse autoplay) simply keep the poster.
 * - `parallax` shifts the layer down as the page scrolls for a little depth.
 */
export default function HeroVideo({ src, poster, alt = "", parallax = false, className = "" }) {
    const reduce = useReducedMotion();
    const videoRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [mobile] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia("(max-width: 767px)").matches : false
    );

    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 900], [0, parallax && !reduce ? 140 : 0]);
    const scale = useTransform(scrollY, [0, 900], [1, parallax && !reduce ? 1.06 : 1]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v || reduce) return;
        if (v.readyState >= 3) setReady(true);
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    }, [reduce]);

    return (
        <motion.div style={{ y, scale }} className={`absolute inset-0 will-change-transform ${className}`} aria-hidden={alt ? undefined : true}>
            <img src={poster} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
            {!reduce && (
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster={poster}
                    onCanPlay={() => setReady(true)}
                    onPlaying={() => setReady(true)}
                    className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-[1200ms] ease-out ${
                        ready ? "opacity-100" : "opacity-0"
                    }`}
                    data-testid="hero-video"
                >
                    <source src={mobile ? `${src}-mobile.mp4` : `${src}.mp4`} type="video/mp4" />
                </video>
            )}
        </motion.div>
    );
}
