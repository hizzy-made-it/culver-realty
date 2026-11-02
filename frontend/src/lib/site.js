export const BRAND = {
    name: "Culver Realty & Property Management",
    short: "Culver Realty",
    broker: "The Culver Realty team",
    phone: "386.414.3445",
    phoneHref: "tel:+13864143445",
    email: "tracie.culver@tculverrealty.com",
    emailHref: "mailto:tracie.culver@tculverrealty.com",
    address: "2412 John Anderson Drive, Ormond Beach, FL 32176",
    markets: ["Ormond Beach", "Daytona Beach", "Volusia County", "Flagler County"],
    disclaimer:
        "Listing details are for consumers' personal use and are deemed reliable but not guaranteed. Properties may sell, change, or withdraw. This site is not an MLS IDX feed.",
};

export const fmtPrice = (price, type) => {
    if (price == null || price === "" || Number(price) <= 0) return "";
    return `$${Number(price).toLocaleString()}${type === "rent" ? "/mo" : ""}`;
};

export const fmtSqft = (n) => (n ? Number(n).toLocaleString() : "—");

export const coverPhoto = (property) => {
    const photos = (property?.photos || []).filter((p) => !p.hidden);
    const cover = photos.find((p) => p.cover);
    return (cover || photos[0] || {}).url || "";
};

export const statusLabel = (p) => {
    if (p.status === "sold") return "Sold";
    if (p.status === "pending") return "Pending";
    if (p.status === "draft") return "Draft";
    if (p.status === "off-market") return "Off Market";
    return p.listing_type === "rent" ? "For Rent" : "For Sale";
};

export const fullAddress = (p) => `${p.address}, ${p.city}, ${p.state || "FL"} ${p.zip || ""}`.trim();

export const MAP_URL = "https://maps.google.com/?q=2412+John+Anderson+Drive,+Ormond+Beach,+FL+32176";
export const MAP_EMBED_URL = "https://maps.google.com/maps?q=2412+John+Anderson+Drive,+Ormond+Beach,+FL+32176&output=embed";

// "3-bed, 2-bath single family home for sale" — built only from the listing's own fields.
export const listingSummary = (p) => {
    const bits = [];
    if (p.beds != null) bits.push(`${p.beds}-bed`);
    if (p.baths != null) bits.push(`${p.baths}-bath`);
    const type = (p.property_type || "home").toLowerCase();
    const noun = /condo|townhome|townhouse|apartment/.test(type) ? type : `${type} home`.replace("home home", "home");
    const status = p.status === "sold" ? "sold" : p.listing_type === "rent" ? "for rent" : "for sale";
    return `${bits.length ? bits.join(", ") + " " : ""}${noun} ${status}`;
};

// Descriptive alt text for listing photos. A photo's own `alt` (if an admin ever sets one) wins.
export const photoAlt = (p, photo, i, total) =>
    (photo && photo.alt) || `${fullAddress(p)} — ${listingSummary(p)}, photo ${i + 1} of ${total}`;
