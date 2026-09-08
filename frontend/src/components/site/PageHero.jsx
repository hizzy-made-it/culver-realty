import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "../motion";
import HeroVideo from "./HeroVideo";
import HeroAtmosphere from "./HeroAtmosphere";
import KineticHeading from "./KineticHeading";

const SIZES = {
    sm: { pad: "py-16 md:py-20", h1: "text-4xl sm:text-5xl", sub: "mt-4 max-w-xl text-sm md:text-base" },
    md: { pad: "py-16 md:py-24", h1: "text-4xl sm:text-5xl", sub: "mt-5 max-w-2xl leading-relaxed text-sm md:text-base" },
    lg: { pad: "py-20 md:py-28", h1: "text-4xl sm:text-5xl lg:text-6xl max-w-3xl leading-[1.08]", sub: "mt-6 max-w-2xl leading-relaxed" },
};

/**
 * Shared page hero. Navy band by default; pass `video` (extension-less path) + `poster`
 * for an ambient footage hero. Motion: eyebrow rule draws in, headline rises word by word,
 * copy and CTAs settle after it, atmosphere layer drifts underneath.
 */
export default function PageHero({
    eyebrow,
    title,
    sub,
    children,
    video,
    poster,
    alt = "",
    size = "lg",
    minHeight = "min-h-[62vh]",
    testid,
    className = "",
}) {
    const reduce = useReducedMotion();
    const s = SIZES[size] || SIZES.lg;
    const hasMedia = Boolean(video);

    const fade = (d) => ({
        initial: reduce ? { opacity: 0 } : { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: EASE_OUT, delay: d },
    });

    return (
        <section
            className={`relative overflow-hidden bg-navy text-bone ${hasMedia ? `${minHeight} flex items-end` : s.pad} ${className}`}
            data-testid={testid}
        >
            {hasMedia && (
                <>
                    <HeroVideo src={video} poster={poster} alt={alt} />
                    <div className="absolute inset-0 bg-gradient-to-t from-navy-deep/90 via-navy/45 to-navy/15" />
                </>
            )}
            <HeroAtmosphere subtle={hasMedia} />

            <div className={`relative max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 w-full ${hasMedia ? "pt-36 pb-14 md:pb-16" : ""}`}>
                {eyebrow && (
                    <motion.div className="flex items-center gap-3 mb-3" {...fade(0)}>
                        <motion.span
                            className="h-px w-8 bg-gold origin-left"
                            initial={reduce ? { opacity: 0 } : { scaleX: 0 }}
                            animate={reduce ? { opacity: 1 } : { scaleX: 1 }}
                            transition={{ duration: 0.8, ease: EASE_OUT, delay: 0.15 }}
                        />
                        <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold">{eyebrow}</p>
                    </motion.div>
                )}

                <KineticHeading
                    as="h1"
                    title={title}
                    className={`font-serif tracking-tight font-medium text-bone ${s.h1}`}
                    delay={0.12}
                />

                {sub && (
                    <motion.p className={`text-bone/75 ${s.sub}`} {...fade(0.45)}>
                        {sub}
                    </motion.p>
                )}

                {children && (
                    <motion.div className="mt-9" {...fade(0.6)}>
                        {children}
                    </motion.div>
                )}
            </div>
        </section>
    );
}
