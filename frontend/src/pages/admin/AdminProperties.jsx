import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Pencil, EyeOff, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "../../lib/api";
import { fmtPrice, statusLabel, coverPhoto } from "../../lib/site";

export default function AdminProperties() {
    const [properties, setProperties] = useState(null);

    const load = () => api.get("/admin/properties").then((r) => setProperties(r.data.properties)).catch(() => setProperties([]));
    useEffect(() => {
        load();
    }, []);

    const unpublish = async (p) => {
        await api.put(`/admin/properties/${p.id}`, { ...p, status: p.status === "draft" ? "live" : "draft" });
        toast.success(p.status === "draft" ? "Published" : "Unpublished");
        load();
    };

    const remove = async (p) => {
        if (!window.confirm(`Delete "${p.address}, ${p.city}"? This cannot be undone.`)) return;
        await api.delete(`/admin/properties/${p.id}`);
        toast.success("Listing deleted");
        load();
    };

    return (
        <div data-testid="admin-properties-page">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-2">Inventory</p>
                    <h1 className="font-serif text-3xl md:text-4xl font-medium text-navy">Properties</h1>
                </div>
                <Link to="/admin/import" data-testid="properties-import-button" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]">
                    <Plus size={15} /> Import from Zillow
                </Link>
            </div>

            <div className="bg-white border border-slate-200/80 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-700 min-w-[760px]" data-testid="properties-table">
                    <thead>
                        <tr className="border-b border-slate-200 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                            <th className="px-5 py-4 font-semibold">Property</th>
                            <th className="px-5 py-4 font-semibold">Price</th>
                            <th className="px-5 py-4 font-semibold">Status</th>
                            <th className="px-5 py-4 font-semibold">Source</th>
                            <th className="px-5 py-4 font-semibold">Updated</th>
                            <th className="px-5 py-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {(properties || []).map((p) => (
                            <tr key={p.id} className="hover:bg-sand-100/60 transition-colors" data-testid={`property-row-${p.slug}`}>
                                <td className="px-5 py-4">
                                    <div className="flex items-center gap-3">
                                        {coverPhoto(p) && <img src={coverPhoto(p)} alt="" className="w-14 h-10 object-cover shrink-0" loading="lazy" />}
                                        <div className="min-w-0">
                                            <p className="font-medium text-navy truncate">{p.address}</p>
                                            <p className="text-xs text-slate-500">{p.city}, {p.state} {p.zip}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-4 font-serif text-lg font-semibold text-navy whitespace-nowrap">{fmtPrice(p.price, p.listing_type)}</td>
                                <td className="px-5 py-4">
                                    <span className={`px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider uppercase ${
                                        p.status === "live" ? "bg-seaglass-muted text-seaglass" : p.status === "sold" ? "bg-gold-soft text-gold-hover" : p.status === "draft" ? "bg-slate-100 text-slate-500" : "bg-navy/10 text-navy"
                                    }`} data-testid={`property-status-${p.slug}`}>
                                        {statusLabel(p)}
                                    </span>
                                </td>
                                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{p.source_provider || "manual"}{p.zpid ? ` · ${p.zpid}` : ""}</td>
                                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}</td>
                                <td className="px-5 py-4">
                                    <div className="flex items-center justify-end gap-1">
                                        <Link to={`/admin/properties/${p.id}`} data-testid={`property-edit-${p.slug}`} aria-label="Edit" className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-500 hover:text-navy transition-colors">
                                            <Pencil size={16} />
                                        </Link>
                                        <button onClick={() => unpublish(p)} data-testid={`property-toggle-${p.slug}`} aria-label={p.status === "draft" ? "Publish" : "Unpublish"} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-500 hover:text-gold transition-colors">
                                            <EyeOff size={16} />
                                        </button>
                                        <button onClick={() => remove(p)} data-testid={`property-delete-${p.slug}`} aria-label="Delete" className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {properties && properties.length === 0 && (
                    <p className="p-10 text-center text-sm text-slate-500" data-testid="properties-empty">No properties yet — import your first from Zillow.</p>
                )}
            </div>
        </div>
    );
}
