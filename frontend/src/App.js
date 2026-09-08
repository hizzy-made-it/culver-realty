import { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import SiteLayout from "@/components/site/SiteLayout";
import Home from "@/pages/Home";
import Listings from "@/pages/Listings";
import ListingDetail from "@/pages/ListingDetail";
import Buyers from "@/pages/Buyers";
import Sellers from "@/pages/Sellers";
import Investors from "@/pages/Investors";
import Management from "@/pages/Management";
import Rentals from "@/pages/Rentals";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Team from "@/pages/Team";
import HomeAway from "@/pages/HomeAway";
import Faq from "@/pages/Faq";
import NotFound from "@/pages/NotFound";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminImport from "@/pages/admin/AdminImport";
import AdminProperties from "@/pages/admin/AdminProperties";
import AdminPropertyEdit from "@/pages/admin/AdminPropertyEdit";
import AdminLeads from "@/pages/admin/AdminLeads";

function ScrollToTop() {
    const { pathname } = useLocation();
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);
    return null;
}

function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading) {
        return (
            <div className="min-h-screen bg-navy grid place-items-center" data-testid="auth-loading">
                <p className="font-serif text-2xl text-bone">Culver <span className="italic text-gold">Realty</span></p>
            </div>
        );
    }
    if (!user) return <Navigate to="/admin/login" state={{ from: location }} replace />;
    return children;
}

function App() {
    return (
        <div className="App">
            <BrowserRouter>
                <AuthProvider>
                    <ScrollToTop />
                    <Routes>
                        <Route element={<SiteLayout />}>
                            <Route path="/" element={<Home />} />
                            <Route path="/listings" element={<Listings />} />
                            <Route path="/listings/:slug" element={<ListingDetail />} />
                            <Route path="/buyers" element={<Buyers />} />
                            <Route path="/sellers" element={<Sellers />} />
                            <Route path="/investors" element={<Investors />} />
                            <Route path="/management" element={<Management />} />
                            <Route path="/rentals" element={<Rentals />} />
                            <Route path="/about" element={<About />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/team" element={<Team />} />
                            <Route path="/home-away" element={<HomeAway />} />
                            <Route path="/faq" element={<Faq />} />
                            <Route path="*" element={<NotFound />} />
                        </Route>
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route
                            path="/admin"
                            element={
                                <RequireAuth>
                                    <AdminLayout />
                                </RequireAuth>
                            }
                        >
                            <Route index element={<AdminDashboard />} />
                            <Route path="import" element={<AdminImport />} />
                            <Route path="properties" element={<AdminProperties />} />
                            <Route path="properties/:id" element={<AdminPropertyEdit />} />
                            <Route path="leads" element={<AdminLeads />} />
                        </Route>
                    </Routes>
                    <Toaster richColors position="top-right" />
                </AuthProvider>
            </BrowserRouter>
        </div>
    );
}

export default App;
