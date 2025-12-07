import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import { redis } from "../lib/redis.js";

export const protectRoute = async (req, res, next) => {
	try {
		let accessToken = req.cookies.accessToken;
		const refreshToken = req.cookies.refreshToken;

		// 1️⃣ No access token at all -> unauthorized
		if (!accessToken && !refreshToken) {
			return res.status(401).json({ message: "Unauthorized - No tokens provided" });
		}

		// 2️⃣ First try verifying access token normally
		try {
			const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
			const user = await User.findById(decoded.userId).select("-password");

			if (!user) return res.status(401).json({ message: "User not found" });

			req.user = user;
			return next();
		} catch (err) {
			// IF ACCESS TOKEN EXPIRED → TRY REFRESH
			if (err.name !== "TokenExpiredError") {
				return res.status(401).json({ message: "Unauthorized - Invalid token" });
			}
		}

		// 3️⃣ Access token expired → verify refresh token
		if (!refreshToken) {
			return res.status(401).json({ message: "Session expired - Login again" });
		}

		let decodedRefresh;
		try {
			decodedRefresh = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
		} catch (err) {
			return res.status(401).json({ message: "Invalid refresh token - Please login again" });
		}

		// 4️⃣ Validate refresh token with Redis
		const storedToken = await redis.get(`refresh_token:${decodedRefresh.userId}`);
		if (storedToken !== refreshToken) {
			return res.status(401).json({ message: "Session invalidated - Login again" });
		}

		// 5️⃣ Issue NEW access token
		const newAccessToken = jwt.sign(
			{ userId: decodedRefresh.userId },
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: "15m" }
		);

		// Set cookie again
		res.cookie("accessToken", newAccessToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
			maxAge: 15 * 60 * 1000,
		});

		const user = await User.findById(decodedRefresh.userId).select("-password");
		req.user = user;

		next();

	} catch (error) {
		console.log("Error in protectRoute middleware", error.message);
		return res.status(401).json({ message: "Unauthorized - Authentication failed" });
	}
};


export const adminRoute = (req, res, next) => {
	if (req.user && req.user.role === "admin") {
		next();
	} else {
		return res.status(403).json({ message: "Access denied - Admin only" });
	}
};
