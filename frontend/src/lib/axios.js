import axios from "axios";

// Frontend needs an absolute API origin when deployed separately from the backend.
// Prefer VITE_API when provided, otherwise fall back to the local dev server while
// developing and to the hosted Render backend in production builds.
const VITE_API = import.meta.env.VITE_API?.replace(/\/$/, "");
const DEFAULT_DEV_API = "http://localhost:5000";
const PROD_FALLBACK_API = "https://ecommerce-app-9a4d.onrender.com";

const resolveBaseUrl = () => {
	if (VITE_API) return `${VITE_API}/api`;
	if (import.meta.env.DEV) return `${DEFAULT_DEV_API}/api`;
	return `${PROD_FALLBACK_API}/api`;
};

const axiosInstance = axios.create({
	baseURL: resolveBaseUrl(),
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
