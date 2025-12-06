import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.route.js";
import productRoutes from "./routes/product.route.js";
import cartRoutes from "./routes/cart.route.js";
import couponRoutes from "./routes/coupon.route.js";
import paymentRoutes from "./routes/payment.route.js";
import analyticsRoutes from "./routes/analytics.route.js";

// ensure we load the .env file located next to this server.js file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, ".env") });

import { connectDB } from "./lib/db.js";

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json({ limit: "10mb" })); // allows you to parse the body of the request
app.use(cookieParser());

// CORS middleware: allow requests from the frontend dev server and allow credentials (cookies)
app.use((req, res, next) => {
	const allowedOrigins = ["http://localhost:5173"||process.env.FRONTEND_URL];
	if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);
	// allow the Vite dev server default host for local development
	allowedOrigins.push("http://localhost:5173");

	const requestOrigin = req.headers.origin;
	if (requestOrigin && allowedOrigins.includes(requestOrigin)) {
		res.header("Access-Control-Allow-Origin", requestOrigin);
	}

	res.header("Access-Control-Allow-Credentials", "true");
	res.header(
		"Access-Control-Allow-Headers",
		"Origin, X-Requested-With, Content-Type, Accept, Authorization"
	);
	res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");

	if (req.method === "OPTIONS") {
		return res.sendStatus(204);
	}

	next();
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);

if (process.env.NODE_ENV === "production") {
	app.use(express.static(path.join(__dirname, "/frontend/dist")));

	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
	});
}

app.listen(PORT, () => {
	console.log("Server is running on http://localhost:" + PORT);
	connectDB();
});
