import { Link } from "react-router-dom";
import { Page } from "../components/motion";

export default function NotFound() {
    return (
        <Page>
            <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-32 text-center" data-testid="not-found-page">
                <p className="font-serif text-5xl text-navy">404</p>
                <p className="text-sm text-slate-500 mt-3">This page drifted out with the tide.</p>
                <Link to="/" data-testid="not-found-home-link" className="inline-flex items-center justify-center mt-8 px-7 py-3.5 bg-navy text-bone text-sm font-semibold tracking-wider uppercase hover:bg-navy-surface transition-all min-h-[44px]">
                    Back home
                </Link>
            </div>
        </Page>
    );
}
