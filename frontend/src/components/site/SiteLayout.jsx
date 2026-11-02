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
            {/* Skip link: hidden until keyboard focus lands on it (WCAG 2.4.1). */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:px-4 focus:py-2.5 focus:bg-navy focus:text-bone focus:text-sm focus:font-semibold"
                data-testid="skip-link"
            >
                Skip to main content
            </a>
            <Nav />
            <div id="main-content" tabIndex={-1} className="flex-1 pb-[68px] md:pb-0 focus:outline-none">
                <AnimatePresence mode="wait" initial={false} onExitComplete={() => window.scrollTo({ top: 0, behavior: "instant" })}>
                    {outlet && cloneElement(outlet, { key: pathname })}
                </AnimatePresence>
            </div>
            <Footer />
            <MobileCallBar />
        </div>
    );
}
