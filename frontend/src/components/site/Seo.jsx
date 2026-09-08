import { useEffect } from "react";

export default function Seo({ title, description, jsonLd }) {
    useEffect(() => {
        if (title) document.title = title;
        if (description) {
            let meta = document.querySelector('meta[name="description"]');
            if (meta) meta.setAttribute("content", description);
        }
        let script;
        if (jsonLd) {
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
