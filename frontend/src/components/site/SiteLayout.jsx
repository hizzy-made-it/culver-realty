import { cloneElement } from "react";
import { Navigate, useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Nav from "./Nav";
import Footer from "./Footer";
import MobileCallBar from "./MobileCallBar";

/** Public layout. Route changes crossfade via each page's <Page> enter/exit. */
export default function SiteLayout() {
    const { pathname, search } = useLocation();
    const outlet = useOutlet();
    // Sale Listings dropped its "For Rent" tab; old links go to Rental Listings. Redirect
    // here, not in the page, so the crossfade never holds a page that only redirects.
    if (pathname === "/listings" && new URLSearchParams(search).get("tab") === "rent") {
        return <Navigate to="/rentals" replace />;
    }
    return (
        <div className="min-h-screen flex flex-col">
            <Nav />
            <div className="flex-1 pb-[68px] md:pb-0">
                <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}>
                    {outlet && cloneElement(outlet, { key: pathname })}
                </AnimatePresence>
            </div>
            <Footer />
            <MobileCallBar />
        </div>
    );
}
