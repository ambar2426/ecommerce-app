import axios from "axios";

// Use Vite env var (VITE_API) in the browser. `process` is not defined in the browser,
// so don't rely on `process.env` here. If VITE_API isn't set for development, default
// to the local backend URL used by this project.
const API = import.meta.env.VITE_API || "http://localhost:5000";

// In development, ensure the base URL points to the backend API namespace
const devBase = API.endsWith("/") ? API.slice(0, -1) + "/api" : API + "/api";

const axiosInstance = axios.create({
	baseURL: import.meta.env.DEV ? devBase : "/api",
	withCredentials: true, // send cookies to the server
});

export default axiosInstance;
