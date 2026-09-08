import axios from "axios";

// Unset (the default) means same-origin "/api" — FastAPI serves the build and the API
// from one process. Set a full URL only for a split deployment. Falling back to "" here
// matters: without it an unset var compiles to the literal string "undefined/api".
export const API = `${process.env.REACT_APP_BACKEND_URL || ""}/api`;

const api = axios.create({ baseURL: API, withCredentials: true });

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("culver_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

export function formatApiErrorDetail(detail) {
    if (detail == null) return "Something went wrong. Please try again.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .filter(Boolean)
            .join(" ");
    if (detail && typeof detail.msg === "string") return detail.msg;
    return String(detail);
}

export default api;
