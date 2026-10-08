import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, FileEdit, Inbox, AlertTriangle, Sparkles, ArrowRight, RefreshCw } from "lucide-react";
import api from "../../lib/api";

const CARDS = [
    { key: "live", label: "Live listings", icon: Building2 },
    { key: "drafts", label: "Drafts", icon: FileEdit },
    { key: "new_leads", label: "New leads", icon: Inbox },
    { key: "failed_imports", label: "Failed imports", icon: AlertTriangle },
];

export default function AdminDashboard() {
    const [stats, setStats] = useState(null);

    const [sync, setSync] = useState(null);
    const [syncError, setSyncError] = useState("");

    useEffect(() => {
        api.get("/admin/stats").then((r) => setStats(r.data)).catch(() => {});
        api.get("/admin/sync").then((r) => setSync(r.data)).catch(() => {});
    }, []);

    // Poll while a run is in progress so the panel updates when it finishes.
    useEffect(() => {
        if (!sync?.running) return undefined;
        const t = setInterval(() => {
            api.get("/admin/sync").then((r) => setSync(r.data)).catch(() => {});
        }, 5000);
        return () => clearInterval(t);
    }, [sync?.running]);

    const runSync = () => {
        setSyncError("");
        api.post("/admin/sync")
            .then(() => setSync((s) => ({ ...(s || {}), running: true })))
            .catch((e) => setSyncError(e?.response?.data?.detail || "Could not start the sync"));
    };

    const lastRun = sync?.runs?.[0];

    return (
        <div data-testid="admin-dashboard">
            <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
                <div>
                    <p className="text-xs uppercase tracking-[0.25em] font-semibold text-gold mb-2">Overview</p>
                    <h1 className="font-serif text-3xl md:text-4xl font-medium text-navy">Dashboard</h1>
                </div>
                <Link
                    to="/admin/import"
                    data-testid="dashboard-import-button"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all min-h-[44px]"
                >
                    <Sparkles size={15} className="text-gold" /> Import from Zillow
                </Link>
            </div>

            {stats && !stats.provider_configured && (
                <div className="mb-8 flex items-start gap-3 bg-gold-soft border border-gold/40 p-4 text-sm text-navy" data-testid="mock-provider-banner">
                    <AlertTriangle size={18} className="text-gold shrink-0 mt-0.5" />
                    <p>
                        <span className="font-semibold">Ingest provider not configured — demo extractor active.</span>{" "}
                        Add a RapidAPI or Apify key to the server environment to pull live Zillow data.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {CARDS.map((card, i) => (
                    <motion.div
                        key={card.key}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.06, duration: 0.4 }}
                        className="p-6 bg-white border border-slate-200/80 shadow-sm flex flex-col justify-between"
                        data-testid={`stat-${card.key.replace(/_/g, "-")}`}
                    >
                        <card.icon size={20} className="text-gold mb-6" />
                        <div>
                            <p className="font-serif text-4xl font-semibold text-navy">{stats ? stats[card.key] : "—"}</p>
                            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 font-semibold mt-1">{card.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white border border-slate-200/80 p-6 mt-10" data-testid="listing-sync">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div>
                        <h2 className="font-serif text-xl font-semibold text-navy">Daily listing sync</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Prices, new listings, sold and rentals from Zillow for Tracie Culver and Alexis Strong.{" "}
                            {sync?.enabled ? "Runs every morning at 6am." : "Scheduler is off on this server."}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={runSync}
                        disabled={sync?.running}
                        data-testid="sync-run-button"
                        className="inline-flex items-center gap-2 px-4 py-2.5 border border-navy text-navy text-xs font-semibold tracking-wider uppercase hover:bg-navy hover:text-bone disabled:opacity-50 transition-colors min-h-[44px]"
                    >
                        <RefreshCw size={14} className={sync?.running ? "animate-spin" : ""} />
                        {sync?.running ? "Syncing…" : "Run now"}
                    </button>
                </div>
                {syncError && <p className="text-sm text-red-600 mb-3">{syncError}</p>}
                {lastRun ? (
                    <div className="text-sm">
                        <p className="text-navy">
                            Last run {new Date(lastRun.started_at).toLocaleString()} ·{" "}
                            <span className={lastRun.status === "failed" ? "text-red-600 font-semibold" : "text-seaglass font-semibold"}>
                                {lastRun.status}
                            </span>{" "}
                            · {lastRun.changes.length} change{lastRun.changes.length === 1 ? "" : "s"}
                        </p>
                        {lastRun.changes.length > 0 && (
                            <ul className="mt-3 space-y-1 text-xs text-slate-600 max-h-56 overflow-y-auto">
                                {lastRun.changes.map((c) => <li key={c}>{c}</li>)}
                            </ul>
                        )}
                        {lastRun.errors.length > 0 && (
                            <ul className="mt-3 space-y-1 text-xs text-red-600">
                                {lastRun.errors.map((e) => <li key={e}>{e}</li>)}
                            </ul>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">No sync has run yet.</p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-10">
                <div className="bg-white border border-slate-200/80 p-6" data-testid="recent-imports">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-serif text-xl font-semibold text-navy">Recent imports</h2>
                        <Link to="/admin/import" className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-seaglass hover:text-gold transition-colors" data-testid="recent-imports-new-link">
                            New import <ArrowRight size={12} />
                        </Link>
                    </div>
                    {stats?.recent_imports?.length ? (
                        <ul className="divide-y divide-slate-100">
                            {stats.recent_imports.map((imp) => (
                                <li key={imp.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                                    <div className="min-w-0">
                                        <p className="text-navy font-medium truncate">zpid {imp.zpid || "—"}</p>
                                        <p className="text-xs text-slate-500 truncate">{imp.url}</p>
                                    </div>
                                    <span
                                        className={`shrink-0 px-2.5 py-1 text-[0.65rem] font-semibold tracking-wider uppercase ${
                                            imp.status === "published"
                                                ? "bg-seaglass-muted text-seaglass"
                                                : imp.status === "failed"
                                                  ? "bg-red-50 text-red-600"
                                                  : "bg-gold-soft text-gold-hover"
                                        }`}
                                    >
                                        {imp.status}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No imports yet. Paste a Zillow link to publish your first listing.</p>
                    )}
                </div>
                <div className="bg-white border border-slate-200/80 p-6" data-testid="recent-leads">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="font-serif text-xl font-semibold text-navy">Latest leads</h2>
                        <Link to="/admin/leads" className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase text-seaglass hover:text-gold transition-colors" data-testid="recent-leads-all-link">
                            Inbox <ArrowRight size={12} />
                        </Link>
                    </div>
                    {stats?.recent_leads?.length ? (
                        <ul className="divide-y divide-slate-100">
                            {stats.recent_leads.map((lead) => (
                                <li key={lead.id} className="py-3 text-sm">
                                    <p className="text-navy font-medium">{lead.name} <span className="text-xs text-slate-400 font-normal">· {lead.type.replace(/_/g, " ")}</span></p>
                                    <p className="text-xs text-slate-500 truncate">{lead.message || lead.listing_address || "—"}</p>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-slate-500">No leads yet. Inquiries from listings and forms will land here.</p>
                    )}
                </div>
            </div>
        </div>
    );
}
