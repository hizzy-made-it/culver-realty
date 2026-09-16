import { motion, useReducedMotion } from "framer-motion";

/** Shared motion tokens. CSS twin: Tailwind `ease-luxe`. */
export const EASE = [0.22, 1, 0.36, 1];
export const EASE_OUT = EASE; // legacy alias
export const DUR = { fast: 0.2, base: 0.4, slow: 0.7 };
export const SPRING = { type: "spring", stiffness: 380, damping: 32 };

/** Page wrapper: fade + rise on mount, fade on exit (route transitions in SiteLayout). */
export function Page({ children, className = "" }) {
    const reduce = useReducedMotion();
    return (
        <motion.main
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: DUR.fast, ease: EASE } }}
            transition={{ duration: DUR.base, ease: EASE }}
        >
            {children}
        </motion.main>
    );
}

export function Reveal({ children, className = "", delay = 0 }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: DUR.base, ease: EASE, delay }}
        >
            {children}
        </motion.div>
    );
}

/**
 * Scroll-triggered stagger for grids and lists. Children should be <StaggerItem>.
 * Replaces the hand-tuned `delay={i * 0.08}` pattern with a real orchestrated cascade.
 */
export function StaggerGroup({ children, className = "", stagger = 0.07, margin = "-60px", ...rest }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            {...rest}
            className={className}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin }}
            variants={{
                initial: {},
                animate: { transition: { staggerChildren: reduce ? 0 : stagger, delayChildren: 0.05 } },
            }}
        >
            {children}
        </motion.div>
    );
}

export function StaggerItem({ children, className = "" }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
            className={className}
            variants={{
                initial: reduce ? { opacity: 0 } : { opacity: 0, y: 20 },
                animate: { opacity: 1, y: 0, transition: { duration: DUR.base, ease: EASE } },
            }}
        >
            {children}
        </motion.div>
    );
}
