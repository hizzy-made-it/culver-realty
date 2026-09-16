import { cloneElement } from "react";
import { useLocation, useOutlet } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import Nav from "./Nav";
import Footer from "./Footer";
import MobileCallBar from "./MobileCallBar";

/** Public layout. Route changes crossfade via each page's <Page> enter/exit. */
export default function SiteLayout() {
    const { pathname } = useLocation();
    const outlet = useOutlet();
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
