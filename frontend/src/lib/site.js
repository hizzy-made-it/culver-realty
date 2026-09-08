export const BRAND = {
    name: "Culver Realty & Property Management",
    short: "Culver Realty",
    broker: "The Culver Realty team",
    phone: "386.414.3445",
    phoneHref: "tel:+13864143445",
    email: "heathdt1027@gmail.com",
    emailHref: "mailto:heathdt1027@gmail.com",
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
