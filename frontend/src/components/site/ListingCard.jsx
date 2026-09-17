import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, Bath, Ruler } from "lucide-react";
import { fmtPrice, fmtSqft, coverPhoto, statusLabel } from "../../lib/site";
import { EASE, DUR, useReducedMotion } from "../motion";

export default function ListingCard({ property, index = 0 }) {
    const cover = coverPhoto(property);
    const isSold = property.status === "sold";
    const reduce = useReducedMotion();
    return (
        <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            exit={{ opacity: 0, scale: 0.98, transition: { duration: DUR.fast, ease: EASE } }}
            transition={{ duration: DUR.base, ease: EASE, delay: Math.min(index % 3, 2) * 0.07 }}
            className="h-full"
        >
            <Link
                to={`/listings/${property.slug}`}
                className="card-hover group relative border border-navy/10 bg-white shadow-sm overflow-hidden flex flex-col h-full"
                data-testid={`listing-card-${property.slug}`}
            >
                <div className="relative aspect-[16/10] overflow-hidden bg-sand-200">
                    {cover && (
                        <img
                            src={cover}
                            alt={property.address}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-500 ease-luxe group-hover:scale-[1.04] ${isSold ? "grayscale-[35%]" : ""}`}
                        />
                    )}
                    <span
                        className={`absolute top-4 left-4 z-10 px-3 py-1 text-[0.65rem] font-semibold tracking-wider uppercase backdrop-blur-md ${
                            isSold ? "bg-gold/95 text-white" : "bg-navy/90 text-bone"
                        }`}
                        data-testid={`listing-status-${property.slug}`}
                    >
                        {statusLabel(property)}
                    </span>
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-navy-deep/85 via-navy-deep/30 to-transparent pointer-events-none" />
                    <p
                        className="absolute bottom-3 left-4 z-10 font-serif text-3xl sm:text-4xl font-semibold text-white tracking-tight drop-shadow-md"
                        data-testid={`listing-price-${property.slug}`}
                    >
                        {property.price ? fmtPrice(property.price, property.listing_type) : "Sold"}
                    </p>
                </div>
                <div className="p-5 flex flex-col flex-1">
                    <p className="text-sm font-medium text-navy">{property.address}</p>
                    <p className="text-sm text-slate-500">
                        {property.city}, {property.state || "FL"} {property.zip}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium text-slate-500 border-t border-slate-100 pt-3 mt-auto">
                        {property.beds != null && (
                            <span className="inline-flex items-center gap-1.5">
                                <BedDouble size={14} className="text-gold" /> {property.beds} bd
                            </span>
                        )}
                        {property.baths != null && (
                            <span className="inline-flex items-center gap-1.5">
                                <Bath size={14} className="text-gold" /> {property.baths} ba
                            </span>
                        )}
                        {property.sqft != null && (
                            <span className="inline-flex items-center gap-1.5">
                                <Ruler size={14} className="text-gold" /> {fmtSqft(property.sqft)} sqft
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}
