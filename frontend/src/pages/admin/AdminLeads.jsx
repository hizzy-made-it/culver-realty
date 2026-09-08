import { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "../../lib/api";

const TYPE_LABELS = {
    listing_inquiry: "Listing inquiry",
    valuation: "Valuation",
    management: "Management",
    tenant: "Tenant",
    home_away: "Home Away",
    contact: "Contact",
};

const STATUS_STYLES = {
    new: "bg-gold-soft text-gold-hover",
    contacted: "bg-seaglass-muted text-seaglass",
    closed: "bg-slate-100 text-slate-500",
};

export default function AdminLeads() {
    const [leads, setLeads] = useState(null);
    const [filter, setFilter] = useState("all");

    const load = () => api.get("/admin/leads").then((r) => setLeads(r.data.leads)).catch(() => setLeads([]));
    useEffect(() => {
        load();
    }, []);

    const setStatus = async (lead, status) => {
        try {
            await api.patch(`/admin/leads/${lead.id}`, { status });
            setLeads((ls) => ls.map((l) => (l.id === lead.id ? { ...l, status } : l)));
        } catch {
            toast.error("Could not update lead");
        }
    };

    const visible = (leads || []).filter((l) => filter === "all" || l.status === filter);

    return (
        <div data-testid="admin-leads-page">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-2">Inbox</p>
                    <h1 className="font-serif text-3xl md:text-4xl font-medium text-navy">Leads</h1>
                </div>
                <div className="flex gap-1" data-testid="leads-filter-tabs">
                    {["all", "new", "contacted", "closed"].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            data-testid={`leads-filter-${s}`}
                            className={`px-4 py-2.5 text-xs font-semibold tracking-wider uppercase transition-colors min-h-[44px] ${
                                filter === s ? "bg-navy text-bone" : "text-slate-500 hover:text-navy"
                            }`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white border border-slate-200/80 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm text-slate-700 min-w-[820px]" data-testid="leads-table">
                    <thead>
                        <tr className="border-b border-slate-200 text-[0.65rem] uppercase tracking-[0.2em] text-slate-500">
                            <th className="px-5 py-4 font-semibold">From</th>
                            <th className="px-5 py-4 font-semibold">Type</th>
                            <th className="px-5 py-4 font-semibold">Message</th>
                            <th className="px-5 py-4 font-semibold">Received</th>
                            <th className="px-5 py-4 font-semibold">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {visible.map((lead) => (
                            <tr key={lead.id} className="hover:bg-sand-100/60 transition-colors align-top" data-testid={`lead-row-${lead.id}`}>
                                <td className="px-5 py-4">
                                    <p className="font-medium text-navy">{lead.name}</p>
                                    <a href={`mailto:${lead.email}`} className="text-xs text-seaglass hover:text-gold transition-colors">{lead.email}</a>
                                    {lead.phone && <p className="text-xs text-slate-500 mt-0.5">{lead.phone}</p>}
                                </td>
                                <td className="px-5 py-4">
                                    <span className="px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider uppercase bg-navy/5 text-navy whitespace-nowrap">
                                        {TYPE_LABELS[lead.type] || lead.type}
                                    </span>
                                    {lead.listing_address && <p className="text-xs text-slate-500 mt-1.5 max-w-[180px]">{lead.listing_address}</p>}
                                </td>
                                <td className="px-5 py-4 text-sm text-slate-600 max-w-[320px]"><p className="line-clamp-3">{lead.message || "—"}</p></td>
                                <td className="px-5 py-4 text-xs text-slate-500 whitespace-nowrap">{lead.created_at ? new Date(lead.created_at).toLocaleString() : "—"}</td>
                                <td className="px-5 py-4">
                                    <select
                                        value={lead.status}
                                        onChange={(e) => setStatus(lead, e.target.value)}
                                        data-testid={`lead-status-${lead.id}`}
                                        className={`px-3 py-2 text-[0.65rem] font-semibold tracking-wider uppercase border-0 focus:outline-none focus:ring-1 focus:ring-gold cursor-pointer min-h-[44px] ${STATUS_STYLES[lead.status] || ""}`}
                                    >
                                        <option value="new">New</option>
                                        <option value="contacted">Contacted</option>
                                        <option value="closed">Closed</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {leads && visible.length === 0 && (
                    <p className="p-10 text-center text-sm text-slate-500" data-testid="leads-empty">
                        {filter === "all" ? "No leads yet — inquiries from listings and forms land here." : `No ${filter} leads.`}
                    </p>
                )}
            </div>
        </div>
    );
}
