import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";

export default function Gallery({ photos = [], address = "" }) {
    const visible = photos.filter((p) => !p.hidden);
    const [index, setIndex] = useState(0);
    const [lightbox, setLightbox] = useState(false);

    const prev = useCallback(() => setIndex((i) => (i - 1 + visible.length) % visible.length), [visible.length]);
    const next = useCallback(() => setIndex((i) => (i + 1) % visible.length), [visible.length]);

    useEffect(() => {
        if (!lightbox) return;
        const onKey = (e) => {
            if (e.key === "Escape") setLightbox(false);
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [lightbox, prev, next]);

    if (visible.length === 0) return null;
    const current = visible[Math.min(index, visible.length - 1)];

    return (
        <div data-testid="listing-gallery">
            <div className="relative aspect-[16/10] md:aspect-[16/8] overflow-hidden bg-sand-200 group">
                <AnimatePresence mode="wait">
                    <motion.img
                        key={current.url + index}
                        src={current.url}
                        alt={address}
                        initial={{ opacity: 0.4, scale: 1.02 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className="w-full h-full object-cover cursor-zoom-in"
                        drag={visible.length > 1 ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.2}
                        onDragEnd={(e, info) => {
                            if (info.offset.x < -60) next();
                            else if (info.offset.x > 60) prev();
                        }}
                        onClick={() => setLightbox(true)}
                        data-testid="gallery-main-image"
                    />
                </AnimatePresence>
                {visible.length > 1 && (
                    <>
                        <button onClick={prev} aria-label="Previous photo" data-testid="gallery-prev-button"
                            className="absolute left-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-navy/60 text-bone backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navy">
                            <ChevronLeft size={20} />
                        </button>
                        <button onClick={next} aria-label="Next photo" data-testid="gallery-next-button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-navy/60 text-bone backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-navy">
                            <ChevronRight size={20} />
                        </button>
                    </>
                )}
                <button
                    onClick={() => setLightbox(true)}
                    data-testid="gallery-lightbox-button"
                    className="absolute bottom-3 right-3 inline-flex items-center gap-2 px-4 py-2 bg-navy/70 text-bone text-xs font-semibold tracking-wider uppercase backdrop-blur-sm hover:bg-navy transition-colors min-h-[44px]"
                >
                    <Expand size={14} /> {visible.length} photo{visible.length > 1 ? "s" : ""}
                </button>
            </div>
            {visible.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto no-scrollbar" data-testid="gallery-thumbnails">
                    {visible.map((p, i) => (
                        <button
                            key={p.url + i}
                            onClick={() => setIndex(i)}
                            data-testid={`gallery-thumb-${i}`}
                            aria-label={`Photo ${i + 1}`}
                            className={`shrink-0 w-24 h-16 overflow-hidden border-2 transition-all min-h-[44px] ${
                                i === index ? "border-gold" : "border-transparent opacity-70 hover:opacity-100"
                            }`}
                        >
                            <img src={p.url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                    ))}
                </div>
            )}
            <AnimatePresence>
                {lightbox && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] bg-navy-deep/95 backdrop-blur-sm flex items-center justify-center p-4"
                        onClick={() => setLightbox(false)}
                        data-testid="gallery-lightbox"
                        role="dialog"
                        aria-label="Photo lightbox"
                    >
                        <button className="absolute top-4 right-4 min-h-[44px] min-w-[44px] flex items-center justify-center text-bone hover:text-gold" onClick={() => setLightbox(false)} data-testid="lightbox-close-button" aria-label="Close">
                            <X size={26} />
                        </button>
                        {visible.length > 1 && (
                            <button className="absolute left-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-bone hover:text-gold z-10" onClick={(e) => { e.stopPropagation(); prev(); }} data-testid="lightbox-prev-button" aria-label="Previous">
                                <ChevronLeft size={32} />
                            </button>
                        )}
                        <motion.img
                            key={current.url + index}
                            src={current.url}
                            alt={address}
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="max-h-[85vh] max-w-full object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                        {visible.length > 1 && (
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center text-bone hover:text-gold z-10" onClick={(e) => { e.stopPropagation(); next(); }} data-testid="lightbox-next-button" aria-label="Next">
                                <ChevronRight size={32} />
                            </button>
                        )}
                        <p className="absolute bottom-5 left-1/2 -translate-x-1/2 text-bone/70 text-xs tracking-widest">
                            {index + 1} / {visible.length}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
