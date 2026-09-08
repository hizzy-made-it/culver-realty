import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { LayoutDashboard, Sparkles, Building2, Inbox, Globe, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Seo from "../../components/site/Seo";

const ITEMS = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/import", label: "Import from Zillow", icon: Sparkles },
    { to: "/admin/properties", label: "Properties", icon: Building2 },
    { to: "/admin/leads", label: "Leads", icon: Inbox },
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate("/admin/login");
    };

    const linkCls = ({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors min-h-[44px] ${
            isActive ? "bg-white/10 text-gold border-l-2 border-gold" : "text-bone/70 hover:text-bone hover:bg-white/5"
        }`;

    return (
        <div className="min-h-screen bg-sand-100 flex flex-col lg:flex-row" data-testid="admin-layout">
            <Seo title="Admin | Culver Realty & Property Management" description="Staff dashboard." />
            <aside className="w-full lg:w-64 bg-navy text-bone p-5 lg:p-6 lg:min-h-screen flex lg:flex-col lg:justify-between shrink-0">
                <div className="flex lg:block items-center justify-between w-full">
                    <Link to="/admin" className="leading-none" data-testid="admin-logo">
                        <span className="font-serif text-xl font-semibold">
                            Culver <span className="italic text-gold">Realty</span>
                        </span>
                        <span className="block text-[0.55rem] uppercase tracking-[0.3em] text-bone/50 mt-1">Admin</span>
                    </Link>
                    <nav className="flex lg:flex-col gap-1 lg:mt-10 overflow-x-auto no-scrollbar" data-testid="admin-nav">
                        {ITEMS.map((item) => (
                            <NavLink key={item.to} to={item.to} end={item.end} className={linkCls} data-testid={`admin-nav-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                                <item.icon size={16} />
                                <span className="hidden sm:inline">{item.label}</span>
                            </NavLink>
                        ))}
                    </nav>
                </div>
                <div className="hidden lg:block border-t border-bone/10 pt-4 mt-8">
                    <Link to="/" className="flex items-center gap-3 px-4 py-2.5 text-sm text-bone/70 hover:text-bone transition-colors" data-testid="admin-view-site-link">
                        <Globe size={16} /> View site
                    </Link>
                    <p className="px-4 py-2 text-xs text-bone/50 truncate" data-testid="admin-user-email">{user?.email}</p>
                    <button onClick={handleLogout} data-testid="admin-logout-button" className="flex items-center gap-3 px-4 py-2.5 text-sm text-bone/70 hover:text-gold transition-colors w-full text-left min-h-[44px]">
                        <LogOut size={16} /> Sign out
                    </button>
                </div>
                <button onClick={handleLogout} data-testid="admin-logout-button-mobile" className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-bone/70 hover:text-gold" aria-label="Sign out">
                    <LogOut size={18} />
                </button>
            </aside>
            <main className="flex-1 p-4 sm:p-8 lg:p-10 min-w-0">
                <Outlet />
            </main>
        </div>
    );
}
