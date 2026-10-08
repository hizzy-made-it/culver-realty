import { useEffect } from "react";

const SITE = "https://www.culverrealtygroup.com";

function setMeta(selector, attr, key, value) {
    if (!value) return;
    let el = document.head.querySelector(selector);
    if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute("content", value);
}

/**
 * Keeps <head> in sync on client-side navigation. The server (backend/seo.py) already
 * renders the correct title, meta, canonical and JSON-LD for the URL a visitor lands on;
 * this only updates them as the visitor navigates inside the app, and avoids duplicating
 * the server's JSON-LD on the landing page.
 */
export default function Seo({ title, description, jsonLd }) {
    useEffect(() => {
        const path = window.location.pathname;
        const url = SITE + (path === "/" ? "/" : path.replace(/\/$/, ""));
        if (title) document.title = title;
        setMeta('meta[name="description"]', "name", "description", description);
        setMeta('meta[property="og:title"]', "property", "og:title", title);
        setMeta('meta[property="og:description"]', "property", "og:description", description);
        setMeta('meta[property="og:url"]', "property", "og:url", url);
        setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
        setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
        let canonical = document.head.querySelector('link[rel="canonical"]');
        if (!canonical) {
            canonical = document.createElement("link");
            canonical.setAttribute("rel", "canonical");
            document.head.appendChild(canonical);
        }
        canonical.setAttribute("href", url);

        // Server JSON-LD for another route is stale after navigation; for this route it is
        // richer than the client copy, so keep it and skip ours.
        let ssrForThisPage = false;
        document.head.querySelectorAll("script[data-ssr-path]").forEach((s) => {
            if (s.getAttribute("data-ssr-path") === path) ssrForThisPage = true;
            else s.remove();
        });
        let script;
        if (jsonLd && !ssrForThisPage) {
            script = document.createElement("script");
            script.type = "application/ld+json";
            script.setAttribute("data-seo", "true");
            script.text = JSON.stringify(jsonLd);
            document.head.appendChild(script);
        }
        return () => {
            if (script) script.remove();
        };
    }, [title, description, jsonLd]);
    return null;
}
