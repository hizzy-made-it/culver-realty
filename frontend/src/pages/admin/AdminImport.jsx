import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Loader2, AlertTriangle, Check, ExternalLink, X, Link2 } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "../../lib/api";

const STATUSES = ["draft", "live", "pending", "sold", "off-market"];
const TYPES = ["sale", "rent"];
const LOAD_MSGS = ["Extracting listing ID…", "Contacting ingest provider…", "Pulling photos & facts…", "Preparing your preview…"];

const inputCls =
    "w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[44px]";

export default function AdminImport() {
    const [url, setUrl] = useState("");
    const [stage, setStage] = useState("idle"); // idle | loading | preview | published
    const [error, setError] = useState("");
    const [form, setForm] = useState(null);
    const [mock, setMock] = useState(false);
    const [duplicate, setDuplicate] = useState(null);
    const [published, setPublished] = useState(null);
    const [publishing, setPublishing] = useState(false);
    const [loadMsg, setLoadMsg] = useState(0);

    useEffect(() => {
        if (stage !== "loading") return;
        const t = setInterval(() => setLoadMsg((m) => (m + 1) % LOAD_MSGS.length), 900);
        return () => clearInterval(t);
    }, [stage]);

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

    const preview = async (e, override) => {
        e?.preventDefault();
        const target = (override || url).trim();
        if (!target) return;
        setError("");
        setLoadMsg(0);
        setStage("loading");
        setForm(null);
        setPublished(null);
        setDuplicate(null);
        try {
            const { data } = await api.post("/admin/ingest/preview", { url: target });
            const d = data.data;
            setMock(data.mock);
            setDuplicate(data.duplicate);
            setForm({
                title: d.title || "",
                address: d.address || "",
                city: d.city || "",
                state: d.state || "FL",
                zip: d.zip || "",
                price: d.price || 0,
                status: "draft",
                listing_type: d.listing_type || "sale",
                beds: d.beds ?? "",
                baths: d.baths ?? "",
                sqft: d.sqft ?? "",
                lot: d.lot || "",
                year_built: d.year_built ?? "",
                property_type: d.property_type || "",
                description: d.description || "",
                featuresText: (d.features || []).join(", "),
                photos: (d.photos || []).map((p, i) => ({ url: p, cover: i === 0, hidden: false })),
                lat: d.lat ?? null,
                lng: d.lng ?? null,
                zpid: data.zpid,
                source_url: target,
                source_provider: data.mock ? "mock" : "zillow",
            });
            setStage("preview");
        } catch (err) {
            setError(formatApiErrorDetail(err.response?.data?.detail));
            setStage("idle");
        }
    };

    const publish = async (targetStatus) => {
        if (!form) return;
        setPublishing(true);
        try {
            const payload = {
                ...form,
                price: Number(form.price) || 0,
                beds: form.beds === "" ? null : Number(form.beds),
                baths: form.baths === "" ? null : Number(form.baths),
                sqft: form.sqft === "" ? null : Number(form.sqft),
                year_built: form.year_built === "" ? null : Number(form.year_built),
                status: targetStatus,
                features: form.featuresText.split(",").map((s) => s.trim()).filter(Boolean),
            };
            delete payload.featuresText;
            const { data } = await api.post("/admin/ingest/publish", payload);
            setPublished(data.property);
            setStage("published");
            toast.success(targetStatus === "live" ? "Listing is live" : "Saved as draft");
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setPublishing(false);
        }
    };

    const removePhoto = (i) => set("photos", form.photos.filter((_, idx) => idx !== i));
    const setCover = (i) => set("photos", form.photos.map((p, idx) => ({ ...p, cover: idx === i })));

    return (
        <div className="max-w-5xl" data-testid="admin-import-page">
            <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-2">Zillow import</p>
            <h1 className="font-serif text-3xl md:text-4xl font-medium text-navy">Paste a link. Publish a listing.</h1>
            <p className="text-sm text-slate-500 mt-2 max-w-xl">
                Drop in a Zillow URL like{" "}
                <code className="text-xs bg-white border border-navy/10 px-1.5 py-0.5">https://www.zillow.com/homedetails/…/12345678_zpid/</code>{" "}
                — review the preview, edit anything, then publish. No IDX fees.
            </p>

            <AnimatePresence>
                {mock && stage !== "idle" && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="mt-6 flex items-start gap-3 bg-gold-soft border border-gold/40 p-4 text-sm text-navy"
                        data-testid="import-mock-banner"
                    >
                        <AlertTriangle size={18} className="text-gold shrink-0 mt-0.5" />
                        <p><span className="font-semibold">Ingest provider not configured — demo extractor active.</span> The preview below uses realistic sample data so the workflow is fully demoable.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <form onSubmit={preview} className="mt-8" data-testid="zillow-import-form">
                <div
                    className={`relative bg-white border-2 border-dashed transition-all ${stage === "loading" ? "border-gold" : "border-navy/30 hover:border-gold"} ${stage === "idle" ? "pulse-ring" : ""}`}
                    data-testid="zillow-drop-zone"
                >
                    <div className="flex flex-col items-center text-center px-6 py-12 md:py-16">
                        <motion.span
                            animate={stage === "loading" ? { rotate: 360 } : { rotate: 0 }}
                            transition={stage === "loading" ? { repeat: Infinity, duration: 1.4, ease: "linear" } : { duration: 0.3 }}
                            className="inline-flex items-center justify-center w-14 h-14 bg-gold-soft text-gold mb-5"
                        >
                            {stage === "loading" ? <Loader2 size={24} /> : <Link2 size={24} />}
                        </motion.span>
                        <p className="font-serif text-2xl md:text-3xl font-semibold text-navy">
                            {stage === "loading" ? "Extracting listing…" : "Drop a Zillow link here"}
                        </p>
                        <p className="text-sm text-slate-500 mt-2 mb-7">Paste with Ctrl+V — extraction starts automatically</p>
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onPaste={(e) => {
                                const text = e.clipboardData.getData("text");
                                if (text && stage !== "loading") {
                                    setUrl(text);
                                    preview(null, text);
                                }
                            }}
                            placeholder="https://www.zillow.com/homedetails/…/12345678_zpid/"
                            aria-label="Zillow listing URL"
                            data-testid="zillow-import-input"
                            className="w-full max-w-2xl px-5 py-4 bg-sand-100 border border-navy/15 text-navy text-sm md:text-base placeholder:text-slate-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all text-center"
                        />
                        <button
                            type="submit"
                            disabled={stage === "loading" || !url.trim()}
                            data-testid="zillow-import-submit-button"
                            className="mt-6 inline-flex items-center justify-center gap-2 px-8 py-4 bg-navy text-bone text-sm font-semibold tracking-[0.15em] uppercase hover:bg-navy-surface active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
                        >
                            {stage === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={15} className="text-gold" />}
                            {stage === "loading" ? "Extracting…" : "Import listing"}
                        </button>
                    </div>
                </div>
                {error && <p className="text-sm text-red-600 mt-3" data-testid="import-error">{error}</p>}
            </form>

            <AnimatePresence mode="wait">
                {stage === "loading" && (
                    <motion.div
                        key="skeleton"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.35 }}
                        className="mt-8 bg-white border border-navy/10 p-6"
                        data-testid="import-loading-skeleton"
                    >
                        <div className="aspect-[16/6] bg-sand-200 shimmer" />
                        <div className="h-7 w-1/3 bg-sand-200 shimmer mt-6" />
                        <div className="h-4 w-1/2 bg-sand-200 shimmer mt-3" />
                        <div className="grid grid-cols-4 gap-3 mt-5">
                            {[1, 2, 3, 4].map((n) => (
                                <div key={n} className="h-12 bg-sand-200 shimmer" />
                            ))}
                        </div>
                        <p className="text-center text-xs uppercase tracking-[0.25em] text-gold font-semibold mt-6" data-testid="import-loading-message">
                            {LOAD_MSGS[loadMsg]}
                        </p>
                    </motion.div>
                )}

                {stage === "preview" && form && (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, y: 24, scale: 0.99 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 18 }}
                        className="mt-8 bg-white border border-navy/10 shadow-lg"
                        data-testid="import-preview-panel"
                    >
                        <div className="p-6 border-b border-navy/10 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold">Preview</p>
                                <p className="text-sm text-slate-500 mt-1">Everything is editable before publishing.</p>
                            </div>
                            {duplicate && (
                                <p className="text-xs bg-gold-soft text-gold-hover px-3 py-2 font-semibold" data-testid="import-duplicate-warning">
                                    A listing with this zpid exists — publishing will update it.
                                </p>
                            )}
                        </div>

                        {form.photos.length > 0 && (
                            <div className="p-6 border-b border-navy/10">
                                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-4">Photos ({form.photos.length})</p>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" data-testid="import-photo-grid">
                                    {form.photos.map((p, i) => (
                                        <div key={p.url + i} className={`relative group border-2 ${p.cover ? "border-gold" : "border-transparent"}`}>
                                            <img src={p.url} alt="" className="w-full aspect-[4/3] object-cover" />
                                            {p.cover && <span className="absolute top-2 left-2 bg-gold text-white text-[0.6rem] font-semibold tracking-wider uppercase px-2 py-0.5">Cover</span>}
                                            <div className="absolute inset-0 bg-navy/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                {!p.cover && (
                                                    <button type="button" onClick={() => setCover(i)} data-testid={`import-photo-cover-${i}`} className="px-3 py-2 bg-white text-navy text-[0.65rem] font-semibold uppercase tracking-wider min-h-[44px]">
                                                        Set cover
                                                    </button>
                                                )}
                                                <button type="button" onClick={() => removePhoto(i)} data-testid={`import-photo-remove-${i}`} aria-label="Remove photo" className="w-11 h-11 flex items-center justify-center bg-red-600 text-white">
                                                    <X size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Title</label>
                                <input className={`${inputCls} mt-1.5`} value={form.title} onChange={(e) => set("title", e.target.value)} data-testid="import-field-title" />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Address</label>
                                <input className={`${inputCls} mt-1.5`} value={form.address} onChange={(e) => set("address", e.target.value)} data-testid="import-field-address" />
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="col-span-1">
                                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">City</label>
                                    <input className={`${inputCls} mt-1.5`} value={form.city} onChange={(e) => set("city", e.target.value)} data-testid="import-field-city" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">State</label>
                                    <input className={`${inputCls} mt-1.5`} value={form.state} onChange={(e) => set("state", e.target.value)} data-testid="import-field-state" />
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Zip</label>
                                    <input className={`${inputCls} mt-1.5`} value={form.zip} onChange={(e) => set("zip", e.target.value)} data-testid="import-field-zip" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Price {form.listing_type === "rent" ? "($/mo)" : "($)"}</label>
                                <input type="number" className={`${inputCls} mt-1.5`} value={form.price} onChange={(e) => set("price", e.target.value)} data-testid="import-field-price" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Status</label>
                                    <select className={`${inputCls} mt-1.5`} value={form.status} onChange={(e) => set("status", e.target.value)} data-testid="import-field-status">
                                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Type</label>
                                    <select className={`${inputCls} mt-1.5`} value={form.listing_type} onChange={(e) => set("listing_type", e.target.value)} data-testid="import-field-type">
                                        <option value="sale">For Sale</option>
                                        <option value="rent">For Rent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-3 md:col-span-2">
                                {[["beds", "Beds"], ["baths", "Baths"], ["sqft", "Sqft"], ["year_built", "Year built"]].map(([k, label]) => (
                                    <div key={k}>
                                        <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">{label}</label>
                                        <input type="number" step={k === "baths" ? "0.5" : "1"} className={`${inputCls} mt-1.5`} value={form[k]} onChange={(e) => set(k, e.target.value)} data-testid={`import-field-${k.replace("_", "-")}`} />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Lot</label>
                                <input className={`${inputCls} mt-1.5`} value={form.lot} onChange={(e) => set("lot", e.target.value)} data-testid="import-field-lot" />
                            </div>
                            <div>
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Property type</label>
                                <input className={`${inputCls} mt-1.5`} value={form.property_type} onChange={(e) => set("property_type", e.target.value)} data-testid="import-field-property-type" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Description</label>
                                <textarea className={`${inputCls} mt-1.5 min-h-[120px] resize-y`} value={form.description} onChange={(e) => set("description", e.target.value)} data-testid="import-field-description" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">Features (comma separated)</label>
                                <input className={`${inputCls} mt-1.5`} value={form.featuresText} onChange={(e) => set("featuresText", e.target.value)} data-testid="import-field-features" />
                            </div>
                        </div>

                        <div className="p-6 border-t border-navy/10 flex flex-wrap gap-3 justify-end">
                            <button
                                type="button"
                                onClick={() => publish("draft")}
                                disabled={publishing}
                                data-testid="import-save-draft-button"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-navy text-navy text-sm font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all disabled:opacity-50 min-h-[44px]"
                            >
                                Save draft
                            </button>
                            <button
                                type="button"
                                onClick={() => publish("live")}
                                disabled={publishing}
                                data-testid="import-publish-button"
                                className="inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover active:scale-[0.98] transition-all disabled:opacity-50 min-h-[44px]"
                            >
                                {publishing ? <Loader2 size={16} className="animate-spin" /> : <Check size={15} />}
                                {publishing ? "Publishing…" : "Publish listing"}
                            </button>
                        </div>
                    </motion.div>
                )}

                {stage === "published" && published && (
                    <motion.div
                        key="published"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 bg-seaglass-muted border border-seaglass/30 p-8 text-center"
                        data-testid="import-success-panel"
                    >
                        <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-seaglass text-white mb-4">
                            <Check size={22} />
                        </span>
                        <p className="font-serif text-2xl font-semibold text-navy">
                            {published.status === "live" ? "It's live." : "Draft saved."}
                        </p>
                        <p className="text-sm text-slate-600 mt-2">{published.address}, {published.city} — {published.photos?.length || 0} photos copied to our own storage.</p>
                        <div className="flex flex-wrap justify-center gap-3 mt-6">
                            {published.status === "live" && (
                                <a href={`/listings/${published.slug}`} target="_blank" rel="noreferrer" data-testid="import-view-live-link" className="inline-flex items-center gap-2 px-6 py-3 bg-navy text-bone text-xs font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]">
                                    View live listing <ExternalLink size={13} />
                                </a>
                            )}
                            <Link to={`/admin/properties/${published.id}`} data-testid="import-edit-link" className="inline-flex items-center gap-2 px-6 py-3 border border-navy text-navy text-xs font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all min-h-[44px]">
                                Open in editor
                            </Link>
                            <button onClick={() => { setStage("idle"); setUrl(""); setForm(null); }} data-testid="import-another-button" className="inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-navy transition-all min-h-[44px]">
                                Import another
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
