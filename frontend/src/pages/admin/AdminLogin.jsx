import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { formatApiErrorDetail } from "../../lib/api";
import Seo from "../../components/site/Seo";

export default function AdminLogin() {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);
        try {
            await login(email, password);
            navigate(location.state?.from?.pathname || "/admin", { replace: true });
        } catch (err) {
            setError(formatApiErrorDetail(err.response?.data?.detail));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-navy flex items-center justify-center px-4" data-testid="admin-login-page">
            <Seo title="Staff Sign In | Culver Realty & Property Management" description="Staff access." />
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-md bg-white p-8 md:p-10 shadow-2xl"
            >
                <p className="font-serif text-2xl font-semibold text-navy">
                    Culver <span className="italic text-gold">Realty</span>
                </p>
                <p className="text-[0.6rem] uppercase tracking-[0.3em] text-navy/60 mt-1 mb-8">Staff Dashboard</p>
                <form onSubmit={submit} className="space-y-4" data-testid="admin-login-form">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        aria-label="Email"
                        data-testid="admin-email-input"
                        className="w-full px-4 py-3.5 bg-white border border-navy/20 text-navy text-sm placeholder:text-slate-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[44px]"
                    />
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        aria-label="Password"
                        data-testid="admin-password-input"
                        className="w-full px-4 py-3.5 bg-white border border-navy/20 text-navy text-sm placeholder:text-slate-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all min-h-[44px]"
                    />
                    {error && (
                        <p className="text-sm text-red-600" data-testid="admin-login-error">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        data-testid="admin-login-submit"
                        className="w-full inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all disabled:opacity-60 min-h-[44px]"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={14} />}
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
                <a href="/" className="block text-center text-xs text-slate-500 hover:text-navy transition-colors mt-6 min-h-[44px] leading-[44px]" data-testid="admin-login-back-link">
                    ← Back to the public site
                </a>
            </motion.div>
        </div>
    );
}
