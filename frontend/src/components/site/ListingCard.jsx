import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BedDouble, Bath, Ruler } from "lucide-react";
import { fmtPrice, fmtSqft, coverPhoto, statusLabel } from "../../lib/site";

export default function ListingCard({ property, index = 0 }) {
    const cover = coverPhoto(property);
    const isSold = property.status === "sold";
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.2 } }}
            transition={{ duration: 0.45, ease: "easeOut", delay: Math.min(index * 0.06, 0.4) }}
            whileHover={{ y: -6, transition: { duration: 0.25, ease: "easeOut" } }}
        >
            <Link
                to={`/listings/${property.slug}`}
                className="group relative border border-navy/10 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col h-full"
                data-testid={`listing-card-${property.slug}`}
            >
                <div className="relative aspect-[16/10] overflow-hidden bg-sand-200">
                    {cover && (
                        <img
                            src={cover}
                            alt={property.address}
                            loading="lazy"
                            className={`w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 ${isSold ? "grayscale-[35%]" : ""}`}
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
