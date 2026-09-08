import { Outlet } from "react-router-dom";
import Nav from "./Nav";
import Footer from "./Footer";
import MobileCallBar from "./MobileCallBar";

export default function SiteLayout() {
    return (
        <div className="min-h-screen flex flex-col">
            <Nav />
            <div className="flex-1 pb-[68px] md:pb-0">
                <Outlet />
            </div>
            <Footer />
            <MobileCallBar />
        </div>
    );
}
