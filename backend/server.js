import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import express from "express";
import cors from "cors";
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

// CORS middleware using the official cors package so backend/frontend deployments remain in sync
const allowAllOrigins = process.env.CORS_ALLOW_ALL === "true";
const collectOrigins = (...lists) =>
	lists
		.flatMap((entry) =>
			entry
				?.split?.(",")
				.map((value) => value.trim()) ??
				(entry ? [entry] : [])
		)
		.filter(Boolean);

const allowedOrigins = collectOrigins(
	process.env.FRONTEND_URL ?? "https://ecommerce-app-sepia-kappa.vercel.app",
	process.env.BACKEND_URL,
	process.env.RENDER_EXTERNAL_URL,
	process.env.FRONTEND_URLS,
	process.env.ADDITIONAL_ALLOWED_ORIGINS
);

const corsOptions = {
	origin: allowAllOrigins
		? true
		: (origin, callback) => {
			if (!origin) return callback(null, true); // allow same-origin/server-to-server
			if (allowedOrigins.includes(origin)) return callback(null, true);
			return callback(new Error(`Origin ${origin} not allowed by CORS`));
		},
	methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
