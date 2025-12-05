import mongoose from "mongoose";

export const connectDB = async () => {
	try {
		const conn = await mongoose.connect(process.env.MONGO_URI || "mongodb+srv://mittalambar26_db_user:iST2zepUGV45EStL@cluster0.zralb1q.mongodb.net");
		console.log(`MongoDB connected: ${conn.connection.host}`);
	} catch (error) {
		console.log("Error connecting to MONGODB", error.message);
		process.exit(1);
	}
	const uri = process.env.MONGO_URI;
	if (!uri) {
		console.warn("MONGO_URI is not set. Skipping MongoDB connection.");
		return;
	}

	// Retry loop with simple backoff so the app doesn't exit immediately in environments
	// where network access or whitelist may be temporarily unavailable (e.g., deploy time)
	const maxRetries = Infinity; // keep retrying
	let attempt = 0;
	const connectWithRetry = async () => {
		try {
			attempt += 1;
			const conn = await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
			console.log(`MongoDB connected: ${conn.connection.host}`);
		} catch (error) {
			console.error("Error connecting to MONGODB", error.message);
			if (attempt === 1) {
				console.error("If you're using MongoDB Atlas, ensure your deployment's IP is allowed in Network Access (or set 0.0.0.0/0 for testing). See https://www.mongodb.com/docs/atlas/security-whitelist/");
			}
			const delay = Math.min(30000, 2000 * attempt);
			console.log(`Retrying MongoDB connection in ${delay / 1000}s (attempt ${attempt})`);
			setTimeout(connectWithRetry, delay);
		}
	};

	connectWithRetry();
};
