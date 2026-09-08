import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT } from "../motion";

/**
 * Headline that rises into view one word at a time.
 * `title` may be a string, or an array of parts: [{ text, className }] so styled
 * fragments (e.g. an italic gold word) survive the word split.
 */
export default function KineticHeading({ as: Tag = "h1", title, className = "", delay = 0.1, stagger = 0.05, ...rest }) {
    const reduce = useReducedMotion();
    const parts = Array.isArray(title) ? title : [{ text: title }];

    const words = [];
    parts.forEach((part, pi) => {
        const tokens = String(part.text).split(/(\s+)/);
        tokens.forEach((tok, ti) => {
            if (tok === "") return;
            if (/^\s+$/.test(tok)) {
                words.push({ key: `${pi}-${ti}`, space: true });
            } else {
                words.push({ key: `${pi}-${ti}`, text: tok, className: part.className || "" });
            }
        });
    });

    if (reduce) {
        return (
            <Tag className={className} {...rest}>
                {words.map((w) => (w.space ? " " : <span key={w.key} className={w.className}>{w.text}</span>))}
            </Tag>
        );
    }

    let idx = 0;
    return (
        <Tag className={className} {...rest}>
            {words.map((w) => {
                if (w.space) return " ";
                const i = idx++;
                return (
                    <span key={w.key} className="inline-block overflow-hidden align-bottom pb-[0.08em] -mb-[0.08em]">
                        <motion.span
                            className={`inline-block ${w.className}`}
                            initial={{ y: "110%", opacity: 0 }}
                            animate={{ y: "0%", opacity: 1 }}
                            transition={{ duration: 0.8, ease: EASE_OUT, delay: delay + i * stagger }}
                        >
                            {w.text}
                        </motion.span>
                    </span>
                );
            })}
        </Tag>
    );
}
