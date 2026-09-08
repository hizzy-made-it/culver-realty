import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ArrowUp, ArrowDown, X, Star, EyeOff, Eye, Plus, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "../../lib/api";

const inputCls =
    "w-full px-4 py-3 bg-white border border-navy/20 text-navy text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[44px]";

export default function AdminPropertyEdit() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState(null);
    const [newPhoto, setNewPhoto] = useState("");
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        api.get(`/admin/properties/${id}`)
            .then((r) => {
                const p = r.data.property;
                setForm({ ...p, featuresText: (p.features || []).join(", ") });
            })
            .catch(() => {
                toast.error("Listing not found");
                navigate("/admin/properties");
            });
    }, [id, navigate]);

    if (!form) {
        return (
            <div className="space-y-4" data-testid="property-edit-loading">
                <div className="h-8 w-1/3 bg-sand-200 shimmer" />
                <div className="h-64 bg-sand-200 shimmer" />
            </div>
        );
    }

    const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
    const photos = form.photos || [];

    const movePhoto = (i, dir) => {
        const j = i + dir;
        if (j < 0 || j >= photos.length) return;
        const next = [...photos];
        [next[i], next[j]] = [next[j], next[i]];
        set("photos", next);
    };

    const save = async (statusOverride) => {
        setSaving(true);
        try {
            const payload = {
                ...form,
                status: statusOverride || form.status,
                price: Number(form.price) || 0,
                beds: form.beds === "" || form.beds == null ? null : Number(form.beds),
                baths: form.baths === "" || form.baths == null ? null : Number(form.baths),
                sqft: form.sqft === "" || form.sqft == null ? null : Number(form.sqft),
                year_built: form.year_built === "" || form.year_built == null ? null : Number(form.year_built),
                lat: form.lat === "" || form.lat == null ? null : Number(form.lat),
                lng: form.lng === "" || form.lng == null ? null : Number(form.lng),
                features: form.featuresText.split(",").map((s) => s.trim()).filter(Boolean),
            };
            delete payload.featuresText;
            await api.put(`/admin/properties/${id}`, payload);
            toast.success(statusOverride === "live" ? "Published" : "Saved");
            if (statusOverride) set("status", statusOverride);
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setSaving(false);
        }
    };

    const label = (text) => <label className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold">{text}</label>;

    return (
        <div className="max-w-5xl" data-testid="admin-property-edit">
            <Link to="/admin/properties" className="inline-flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-slate-500 hover:text-navy transition-colors min-h-[44px]" data-testid="edit-back-link">
                <ArrowLeft size={14} /> All properties
            </Link>
            <div className="flex flex-wrap items-end justify-between gap-4 mt-2 mb-8">
                <h1 className="font-serif text-3xl md:text-4xl font-medium text-navy">{form.address}, {form.city}</h1>
                <div className="flex gap-3">
                    <button onClick={() => save()} disabled={saving} data-testid="edit-save-button" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 border border-navy text-navy text-sm font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all disabled:opacity-50 min-h-[44px]">
                        {saving ? <Loader2 size={15} className="animate-spin" /> : null} Save
                    </button>
                    <button onClick={() => save(form.status === "live" ? "draft" : "live")} disabled={saving} data-testid="edit-publish-button" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gold text-white text-sm font-semibold tracking-wider uppercase hover:bg-gold-hover transition-all disabled:opacity-50 min-h-[44px]">
                        {form.status === "live" ? "Unpublish" : "Publish"}
                    </button>
                </div>
            </div>

            <div className="bg-white border border-navy/10 p-6 mb-6" data-testid="photo-manager">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mb-4">Photos ({photos.length})</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {photos.map((p, i) => (
                        <div key={p.url + i} className={`relative group border-2 ${p.cover ? "border-gold" : "border-transparent"} ${p.hidden ? "opacity-40" : ""}`} data-testid={`photo-item-${i}`}>
                            <img src={p.url} alt="" className="w-full aspect-[4/3] object-cover" />
                            {p.cover && <span className="absolute top-2 left-2 bg-gold text-white text-[0.6rem] font-semibold tracking-wider uppercase px-2 py-0.5">Cover</span>}
                            <div className="absolute inset-0 bg-navy/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                                <button onClick={() => movePhoto(i, -1)} aria-label="Move up" data-testid={`photo-up-${i}`} className="w-9 h-9 flex items-center justify-center bg-white text-navy"><ArrowUp size={14} /></button>
                                <button onClick={() => movePhoto(i, 1)} aria-label="Move down" data-testid={`photo-down-${i}`} className="w-9 h-9 flex items-center justify-center bg-white text-navy"><ArrowDown size={14} /></button>
                                <button onClick={() => set("photos", photos.map((ph, idx) => ({ ...ph, cover: idx === i })))} aria-label="Set cover" data-testid={`photo-cover-${i}`} className="w-9 h-9 flex items-center justify-center bg-gold text-white"><Star size={14} /></button>
                                <button onClick={() => set("photos", photos.map((ph, idx) => (idx === i ? { ...ph, hidden: !ph.hidden } : ph)))} aria-label="Toggle hidden" data-testid={`photo-hide-${i}`} className="w-9 h-9 flex items-center justify-center bg-white text-navy">{p.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                                <button onClick={() => set("photos", photos.filter((_, idx) => idx !== i))} aria-label="Remove" data-testid={`photo-remove-${i}`} className="w-9 h-9 flex items-center justify-center bg-red-600 text-white"><X size={14} /></button>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3 mt-4">
                    <label
                        className={`inline-flex items-center gap-2 px-5 py-3 border border-navy text-navy text-xs font-semibold tracking-wider uppercase transition-all min-h-[44px] shrink-0 ${uploading ? "opacity-50" : "cursor-pointer hover:bg-navy hover:text-bone"}`}
                        data-testid="photo-upload-label"
                    >
                        {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploading ? "Uploading…" : "Upload"}
                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            multiple
                            className="hidden"
                            disabled={uploading}
                            data-testid="photo-upload-input"
                            onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                e.target.value = "";
                                if (!files.length) return;
                                setUploading(true);
                                const added = [];
                                for (const file of files) {
                                    const fd = new FormData();
                                    fd.append("file", file);
                                    try {
                                        const r = await api.post("/admin/uploads", fd);
                                        added.push(r.data.url);
                                    } catch (err) {
                                        toast.error(formatApiErrorDetail(err?.response?.data?.detail) || `Could not upload ${file.name}`);
                                    }
                                }
                                if (added.length) {
                                    setForm((f) => ({
                                        ...f,
                                        photos: [
                                            ...(f.photos || []),
                                            ...added.map((url, i) => ({ url, cover: (f.photos || []).length === 0 && i === 0, hidden: false })),
                                        ],
                                    }));
                                    toast.success(`${added.length} photo${added.length > 1 ? "s" : ""} uploaded`);
                                }
                                setUploading(false);
                            }}
                        />
                    </label>
                    <input value={newPhoto} onChange={(e) => setNewPhoto(e.target.value)} placeholder="Add photo by URL…" className={inputCls} data-testid="photo-add-input" />
                    <button
                        onClick={() => {
                            if (!newPhoto.trim()) return;
                            set("photos", [...photos, { url: newPhoto.trim(), cover: photos.length === 0, hidden: false }]);
                            setNewPhoto("");
                        }}
                        data-testid="photo-add-button"
                        className="inline-flex items-center gap-2 px-5 py-3 border border-navy text-navy text-xs font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone transition-all min-h-[44px] shrink-0"
                    >
                        <Plus size={14} /> Add
                    </button>
                </div>
            </div>

            <div className="bg-white border border-navy/10 p-6 grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="property-edit-form">
                <div className="md:col-span-2">{label("Title")}<input className={`${inputCls} mt-1.5`} value={form.title || ""} onChange={(e) => set("title", e.target.value)} data-testid="edit-field-title" /></div>
                <div>{label("Address")}<input className={`${inputCls} mt-1.5`} value={form.address || ""} onChange={(e) => set("address", e.target.value)} data-testid="edit-field-address" /></div>
                <div className="grid grid-cols-3 gap-3">
                    <div>{label("City")}<input className={`${inputCls} mt-1.5`} value={form.city || ""} onChange={(e) => set("city", e.target.value)} data-testid="edit-field-city" /></div>
                    <div>{label("State")}<input className={`${inputCls} mt-1.5`} value={form.state || ""} onChange={(e) => set("state", e.target.value)} data-testid="edit-field-state" /></div>
                    <div>{label("Zip")}<input className={`${inputCls} mt-1.5`} value={form.zip || ""} onChange={(e) => set("zip", e.target.value)} data-testid="edit-field-zip" /></div>
                </div>
                <div>{label("Price")}<input type="number" className={`${inputCls} mt-1.5`} value={form.price ?? ""} onChange={(e) => set("price", e.target.value)} data-testid="edit-field-price" /></div>
                <div className="grid grid-cols-2 gap-3">
                    <div>{label("Status")}
                        <select className={`${inputCls} mt-1.5`} value={form.status} onChange={(e) => set("status", e.target.value)} data-testid="edit-field-status">
                            {["draft", "live", "pending", "sold", "off-market"].map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>{label("Type")}
                        <select className={`${inputCls} mt-1.5`} value={form.listing_type} onChange={(e) => set("listing_type", e.target.value)} data-testid="edit-field-type">
                            <option value="sale">For Sale</option>
                            <option value="rent">For Rent</option>
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-4 gap-3 md:col-span-2">
                    {[["beds", "Beds"], ["baths", "Baths"], ["sqft", "Sqft"], ["year_built", "Year"]].map(([k, l]) => (
                        <div key={k}>{label(l)}<input type="number" step={k === "baths" ? "0.5" : "1"} className={`${inputCls} mt-1.5`} value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} data-testid={`edit-field-${k.replace("_", "-")}`} /></div>
                    ))}
                </div>
                <div>{label("Lot")}<input className={`${inputCls} mt-1.5`} value={form.lot || ""} onChange={(e) => set("lot", e.target.value)} data-testid="edit-field-lot" /></div>
                <div>{label("Property type")}<input className={`${inputCls} mt-1.5`} value={form.property_type || ""} onChange={(e) => set("property_type", e.target.value)} data-testid="edit-field-property-type" /></div>
                <div>{label("Latitude")}<input type="number" step="any" className={`${inputCls} mt-1.5`} value={form.lat ?? ""} onChange={(e) => set("lat", e.target.value)} data-testid="edit-field-lat" /></div>
                <div>{label("Longitude")}<input type="number" step="any" className={`${inputCls} mt-1.5`} value={form.lng ?? ""} onChange={(e) => set("lng", e.target.value)} data-testid="edit-field-lng" /></div>
                <div className="md:col-span-2">{label("Description")}<textarea className={`${inputCls} mt-1.5 min-h-[120px] resize-y`} value={form.description || ""} onChange={(e) => set("description", e.target.value)} data-testid="edit-field-description" /></div>
                <div className="md:col-span-2">{label("Features (comma separated)")}<input className={`${inputCls} mt-1.5`} value={form.featuresText} onChange={(e) => set("featuresText", e.target.value)} data-testid="edit-field-features" /></div>
                <label className="md:col-span-2 flex items-center gap-3 text-sm text-navy min-h-[44px] cursor-pointer" data-testid="edit-field-featured">
                    <input type="checkbox" checked={!!form.featured} onChange={(e) => set("featured", e.target.checked)} className="w-5 h-5 accent-[#C5A059]" />
                    Feature on the home page
                </label>
            </div>
        </div>
    );
}
