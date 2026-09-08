import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, BedDouble, Bath, Ruler, Calendar, Home as HomeIcon, ExternalLink } from "lucide-react";
import api from "../lib/api";
import { BRAND, fmtPrice, fmtSqft, statusLabel, fullAddress } from "../lib/site";
import { Page, Reveal } from "../components/motion";
import Gallery from "../components/site/Gallery";
import InquiryForm from "../components/site/InquiryForm";
import ListingCard from "../components/site/ListingCard";
import Seo from "../components/site/Seo";

export default function ListingDetail() {
    const { slug } = useParams();
    const [data, setData] = useState(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        setData(null);
        setNotFound(false);
        api.get(`/properties/${slug}`)
            .then((r) => setData(r.data))
            .catch(() => setNotFound(true));
    }, [slug]);

    if (notFound) {
        return (
            <Page>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-32 text-center" data-testid="listing-not-found">
                    <p className="font-serif text-4xl text-navy">This listing has moved on.</p>
                    <p className="text-sm text-slate-500 mt-3">It may have sold, changed, or been withdrawn.</p>
                    <Link to="/listings" className="inline-flex items-center gap-2 mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]" data-testid="not-found-back-link">
                        <ArrowLeft size={15} /> Browse listings
                    </Link>
                </div>
            </Page>
        );
    }

    if (!data) {
        return (
            <Page>
                <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10">
                    <div className="aspect-[16/8] bg-sand-200 shimmer" />
                    <div className="h-8 w-1/3 bg-sand-200 shimmer mt-8" />
                    <div className="h-4 w-1/2 bg-sand-200 shimmer mt-4" />
                </div>
            </Page>
        );
    }

    const p = data.property;
    const facts = [
        { icon: BedDouble, label: "Bedrooms", value: p.beds ?? "—" },
        { icon: Bath, label: "Bathrooms", value: p.baths ?? "—" },
        { icon: Ruler, label: "Living area", value: p.sqft ? `${fmtSqft(p.sqft)} sqft` : "—" },
        { icon: HomeIcon, label: "Type", value: p.property_type || "—" },
        { icon: Calendar, label: "Year built", value: p.year_built || "—" },
        { icon: MapPin, label: "Lot", value: p.lot || "—" },
    ];

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "RealEstateListing",
        name: p.title,
        url: window.location.href,
        address: {
            "@type": "PostalAddress",
            streetAddress: p.address,
            addressLocality: p.city,
            addressRegion: p.state || "FL",
            postalCode: p.zip,
            addressCountry: "US",
        },
        "offers": p.price ? {
            "@type": "Offer",
            price: p.price,
            priceCurrency: "USD",
        } : undefined,
    };

    return (
        <Page>
            <Seo
                title={`${p.address}, ${p.city} FL — ${fmtPrice(p.price, p.listing_type)} | Culver Realty`}
                description={`${statusLabel(p)}: ${p.address}, ${p.city}, FL. ${p.beds ?? ""} bed / ${p.baths ?? ""} bath${p.sqft ? `, ${fmtSqft(p.sqft)} sqft` : ""}. Listed by Culver Realty & Property Management, Ormond Beach.`}
                jsonLd={jsonLd}
            />
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-6" data-testid="listing-detail">
                <Link to="/listings" className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-navy transition-colors min-h-[44px]" data-testid="back-to-listings-link">
                    <ArrowLeft size={14} /> All listings
                </Link>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 mt-2">
                <Gallery photos={p.photos || []} address={fullAddress(p)} />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-10 md:py-14 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
                <div className="lg:col-span-8">
                    <div className="flex flex-wrap items-center gap-4">
                        <span className={`px-3 py-1 text-[0.65rem] font-semibold tracking-wider uppercase ${p.status === "sold" ? "bg-gold text-white" : "bg-navy text-bone"}`} data-testid="detail-status-pill">
                            {statusLabel(p)}
                        </span>
                        {p.listing_type === "rent" && (
                            <span className="px-3 py-1 text-[0.65rem] font-semibold tracking-wider uppercase bg-seaglass text-white">Rental</span>
                        )}
                    </div>
                    <p className="font-serif text-4xl sm:text-5xl font-semibold text-navy tracking-tight mt-5" data-testid="detail-price">
                        {p.price ? fmtPrice(p.price, p.listing_type) : "Sold"}
                    </p>
                    <h1 className="font-sans text-lg md:text-xl font-medium text-slate-700 mt-2" data-testid="detail-address">{fullAddress(p)}</h1>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-navy/10 border border-navy/10 mt-8" data-testid="detail-facts">
                        {facts.map((f) => (
                            <div key={f.label} className="bg-white p-5">
                                <f.icon size={18} className="text-gold mb-2" />
                                <p className="text-[0.65rem] uppercase tracking-[0.2em] text-slate-500 font-semibold">{f.label}</p>
                                <p className="font-serif text-xl font-semibold text-navy mt-1">{f.value}</p>
                            </div>
                        ))}
                    </div>

                    <Reveal className="mt-12">
                        <h2 className="font-serif text-2xl sm:text-3xl font-medium text-navy">About this home</h2>
                        <p className="text-base text-slate-600 leading-relaxed mt-5 whitespace-pre-line" data-testid="detail-description">{p.description}</p>
                    </Reveal>

                    {p.features?.length > 0 && (
                        <Reveal className="mt-12">
                            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-navy">Facts &amp; features</h2>
                            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 mt-6" data-testid="detail-features">
                                {p.features.map((f) => (
                                    <li key={f} className="flex items-center gap-3 text-sm text-slate-700 border-b border-navy/5 pb-3">
                                        <span className="w-1.5 h-1.5 bg-gold shrink-0" /> {f}
                                    </li>
                                ))}
                            </ul>
                        </Reveal>
                    )}

                    {p.lat && p.lng && (
                        <Reveal className="mt-12">
                            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-navy">Location</h2>
                            <div className="mt-6 border border-navy/10 overflow-hidden" data-testid="detail-map">
                                <iframe
                                    title={`Map of ${fullAddress(p)}`}
                                    width="100%"
                                    height="360"
                                    loading="lazy"
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${p.lng - 0.0024}%2C${p.lat - 0.0016}%2C${p.lng + 0.0024}%2C${p.lat + 0.0016}&layer=mapnik&marker=${p.lat}%2C${p.lng}`}
                                />
                            </div>
                            <p className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin size={12} /> {fullAddress(p)}
                                </span>
                                <a
                                    href={`https://www.openstreetmap.org/?mlat=${p.lat}&mlon=${p.lng}#map=17/${p.lat}/${p.lng}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    data-testid="detail-map-larger"
                                    className="inline-flex items-center gap-1 text-seaglass hover:text-gold transition-colors font-medium"
                                >
                                    View larger map <ExternalLink size={11} />
                                </a>
                            </p>
                        </Reveal>
                    )}

                    {(p.source_url || p.mls_name) && (
                        <div className="text-xs text-slate-500 mt-10 border-t border-navy/10 pt-5 space-y-2" data-testid="detail-attribution">
                            <p>
                                {p.listing_broker && (
                                    <>Listed by {p.listing_broker}{p.listing_agent ? ` — ${p.listing_agent}` : ""}. </>
                                )}
                                {p.mls_name && (
                                    <>Listing data courtesy of {p.mls_name}{p.mls_id ? ` (MLS# ${p.mls_id})` : ""}. </>
                                )}
                                Details deemed reliable but not guaranteed.
                                {p.source_url && (
                                    <>
                                        {" "}
                                        <a href={p.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-seaglass hover:text-gold transition-colors font-medium">
                                            View original listing <ExternalLink size={11} />
                                        </a>
                                    </>
                                )}
                            </p>
                            {p.mls_disclaimer && <p className="text-[0.7rem] leading-relaxed text-slate-400">{p.mls_disclaimer}</p>}
                        </div>
                    )}
                </div>

                <aside className="lg:col-span-4">
                    <div className="lg:sticky lg:top-28 space-y-5">
                        <div className="bg-white border border-navy/10 p-6 shadow-sm" data-testid="detail-inquiry-card">
                            <InquiryForm
                                type="listing_inquiry"
                                listingId={p.id}
                                listingAddress={fullAddress(p)}
                                title="Ask about this property"
                                subtitle="The Culver Realty team will get back to you personally."
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <a href={BRAND.phoneHref} data-testid="detail-call-button" className="btn-sheen inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-gold text-white text-xs font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all min-h-[44px]">
                                <Phone size={14} /> Call
                            </a>
                            <a href={BRAND.emailHref} data-testid="detail-email-button" className="inline-flex items-center justify-center gap-2 px-4 py-3.5 border border-navy text-navy text-xs font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all min-h-[44px]">
                                <Mail size={14} /> Email
                            </a>
                        </div>
                    </div>
                </aside>
            </div>

            {data.similar?.length > 0 && (
                <section className="bg-sand-100 border-t border-navy/10 py-16" data-testid="similar-listings">
                    <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12">
                        <Reveal>
                            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-navy mb-10">Similar properties</h2>
                        </Reveal>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
                            {data.similar.map((s, i) => (
                                <ListingCard key={s.id} property={s} index={i} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </Page>
    );
}
