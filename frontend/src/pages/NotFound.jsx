import { Link } from "react-router-dom";
import { Page, StaggerGroup, StaggerItem } from "../components/motion";

export default function NotFound() {
    return (
        <Page>
            <StaggerGroup className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-32 text-center" data-testid="not-found-page">
                <StaggerItem><p className="font-serif text-5xl text-navy">404</p></StaggerItem>
                <StaggerItem><p className="text-sm text-slate-500 mt-3">This page drifted out with the tide.</p></StaggerItem>
                <StaggerItem>
                    <Link to="/" data-testid="not-found-home-link" className="inline-flex items-center justify-center mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface active:scale-[0.98] transition-all duration-200 min-h-[44px]">
                        Back home
                    </Link>
                </StaggerItem>
            </StaggerGroup>
        </Page>
    );
}
