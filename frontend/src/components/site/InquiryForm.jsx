import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api, { formatApiErrorDetail } from "../../lib/api";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryForm({ type = "contact", listingId, listingAddress, title = "Send us a message", subtitle, dark = false }) {
    const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
    const [errors, setErrors] = useState({});
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

    const validate = () => {
        const errs = {};
        if (!form.name.trim()) errs.name = "Your name is required";
        if (!EMAIL_RE.test(form.email)) errs.email = "A valid email is required";
        if (!form.message.trim()) errs.message = "Tell us a little about what you need";
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const submit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setSending(true);
        try {
            await api.post("/leads", { ...form, type, listing_id: listingId, listing_address: listingAddress });
            setSent(true);
        } catch (err) {
            toast.error(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setSending(false);
        }
    };

    const inputCls = `w-full px-4 py-3.5 border text-sm transition-all focus:outline-none focus:ring-1 min-h-[44px] ${
        dark
            ? "bg-white/10 border-white/25 text-white placeholder:text-white/50 focus:border-gold focus:ring-gold"
            : "bg-white border-navy/20 text-navy placeholder:text-slate-400 focus:border-gold focus:ring-gold"
    }`;

    if (sent) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-8 text-center border ${dark ? "border-white/20 bg-white/5" : "border-seaglass/30 bg-seaglass-muted"}`}
                data-testid="inquiry-success"
            >
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-seaglass text-white mb-4">
                    <Check size={22} />
                </span>
                <p className={`font-serif text-2xl font-semibold ${dark ? "text-white" : "text-navy"}`}>Message received.</p>
                <p className={`text-sm mt-2 ${dark ? "text-white/70" : "text-slate-600"}`}>
                    Thank you — Tracie or a member of the team will reach out shortly. For anything urgent, call 386.414.3445.
                </p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={submit} className="space-y-4" data-testid={`${type}-form`} noValidate>
            <div>
                <p className={`font-serif text-2xl font-semibold ${dark ? "text-white" : "text-navy"}`}>{title}</p>
                {subtitle && <p className={`text-sm mt-1 ${dark ? "text-white/70" : "text-slate-500"}`}>{subtitle}</p>}
            </div>
            <div>
                <input className={inputCls} placeholder="Full name *" value={form.name} onChange={set("name")} data-testid={`${type}-name-input`} aria-label="Full name" />
                <AnimatePresence>{errors.name && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xs text-red-600 mt-1" data-testid={`${type}-name-error`}>{errors.name}</motion.p>}</AnimatePresence>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <input className={inputCls} type="email" placeholder="Email *" value={form.email} onChange={set("email")} data-testid={`${type}-email-input`} aria-label="Email" />
                    <AnimatePresence>{errors.email && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xs text-red-600 mt-1" data-testid={`${type}-email-error`}>{errors.email}</motion.p>}</AnimatePresence>
                </div>
                <input className={inputCls} type="tel" placeholder="Phone" value={form.phone} onChange={set("phone")} data-testid={`${type}-phone-input`} aria-label="Phone" />
            </div>
            <div>
                <textarea
                    className={`${inputCls} min-h-[110px] resize-y`}
                    placeholder={type === "listing_inquiry" ? "I'd like to know more about this property… *" : "How can we help? *"}
                    value={form.message}
                    onChange={set("message")}
                    data-testid={`${type}-message-input`}
                    aria-label="Message"
                />
                <AnimatePresence>{errors.message && <motion.p initial={{opacity:0}} animate={{opacity:1}} className="text-xs text-red-600 mt-1" data-testid={`${type}-message-error`}>{errors.message}</motion.p>}</AnimatePresence>
            </div>
            {listingAddress && (
                <p className={`text-xs ${dark ? "text-white/60" : "text-slate-500"}`}>
                    Regarding: <span className="font-medium">{listingAddress}</span>
                </p>
            )}
            <button
                type="submit"
                disabled={sending}
                data-testid={`${type}-form-submit-button`}
                className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all duration-200 disabled:opacity-60 min-h-[44px]"
            >
                {sending ? <Loader2 size={16} className="animate-spin" /> : null}
                {sending ? "Sending…" : "Send message"}
            </button>
        </form>
    );
}
