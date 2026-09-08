import { motion, useReducedMotion } from "framer-motion";

export const EASE_OUT = [0.22, 1, 0.36, 1];

export function Page({ children, className = "" }) {
    const reduce = useReducedMotion();
    return (
        <motion.main
            className={className}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
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
            transition={{ duration: 0.5, ease: "easeOut", delay }}
        >
            {children}
        </motion.div>
    );
}

export const staggerContainer = {
    initial: {},
    animate: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const staggerItem = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Scroll-triggered stagger for grids and lists. Children should be <StaggerItem>.
 * Replaces the hand-tuned `delay={i * 0.08}` pattern with a real orchestrated cascade.
 */
export function StaggerGroup({ children, className = "", stagger = 0.08, margin = "-60px" }) {
    const reduce = useReducedMotion();
    return (
        <motion.div
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
                initial: reduce ? { opacity: 0 } : { opacity: 0, y: 22 },
                animate: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
            }}
        >
            {children}
        </motion.div>
    );
}
