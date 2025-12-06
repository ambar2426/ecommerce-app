import axios from "axios";

// Use Vite env var (VITE_API) in the browser. `process` is not defined in the browser,
// so don't rely on `process.env` here. If VITE_API isn't set, fall back to the
// public backend URL used for production.
const API = import.meta.env.VITE_API || "https://ecommerce-app-9a4d.onrender.com";

// Ensure we have a clean base that ends with `/api` for development.
const devBase = API.replace(/\/$/, "") + "/api";

const axiosInstance = axios.create({
	baseURL: import.meta.env.DEV ? devBase : "/api",
	withCredentials: true,
});

export default axiosInstance;
