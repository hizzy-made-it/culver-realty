import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Pause, Play } from "lucide-react";
import { useReducedMotion } from "../motion";

const MOBILE_MQ = "(max-width: 767px)";

/**
 * Ambient background video for hero sections.
 * - `src` is a path WITHOUT extension; `${src}.mp4` and `${src}-mobile.mp4` are expected.
 *   Omit it for a still-image hero: only the poster renders.
 * - Poster paints instantly; the video cross-fades in once it can play.
 * - Reduced-motion users (and browsers that refuse autoplay) simply keep the poster.
 * - `parallax` shifts the layer down as the page scrolls for a little depth.
 * - A small pause/play toggle sits in the top-right corner: looping motion that starts on its
 *   own must be stoppable (WCAG 2.2.2). It renders outside the aria-hidden layer.
 */
export default function HeroVideo({ src, poster, alt = "", parallax = false, className = "" }) {
    const reduce = useReducedMotion();
    const videoRef = useRef(null);
    const [ready, setReady] = useState(false);
    const [paused, setPaused] = useState(false);
    const [mobile, setMobile] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia(MOBILE_MQ).matches : false
    );

    useEffect(() => {
        const mq = window.matchMedia(MOBILE_MQ);
        const onChange = (e) => setMobile(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    const active = parallax && !reduce;
    // Hooks run unconditionally; when inactive they map to identity and `style` is omitted.
    const { scrollY } = useScroll();
    const y = useTransform(scrollY, [0, 900], [0, active ? 80 : 0]);
    const scale = useTransform(scrollY, [0, 900], [1, active ? 1.04 : 1]);

    // A new <video> mounts when the breakpoint flips; fade it in again once it can play.
    useEffect(() => setReady(false), [mobile]);

    useEffect(() => {
        const v = videoRef.current;
        if (!v || reduce) return;
        if (v.readyState >= 3) setReady(true);
        if (paused) {
            v.pause();
            return;
        }
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
    }, [reduce, mobile, paused]);

    const showVideo = !reduce && src;

    return (
        <>
            <motion.div
                style={active ? { y, scale } : undefined}
                className={`absolute inset-0 ${active ? "will-change-transform" : ""} ${className}`}
                aria-hidden={alt ? undefined : true}
            >
                <img src={poster} alt={alt} className="absolute inset-0 w-full h-full object-cover" />
                {showVideo && (
                    <video
                        key={mobile ? "m" : "d"}
                        ref={videoRef}
                        autoPlay={!paused}
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
            {showVideo && (
                <button
                    type="button"
                    onClick={() => setPaused((v) => !v)}
                    aria-label={paused ? "Play background video" : "Pause background video"}
                    title={paused ? "Play background video" : "Pause background video"}
                    className="absolute top-4 right-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-bone/25 bg-navy-deep/60 text-bone/90 backdrop-blur-sm transition-colors hover:bg-navy-deep/80 hover:text-bone"
                    data-testid="hero-video-toggle"
                >
                    {paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}
                </button>
            )}
        </>
    );
}
