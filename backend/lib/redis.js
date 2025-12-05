import Redis from "ioredis";
import 'dotenv/config';

// Use REDIS_URL from env (set by render/upstash) or fall back to undefined
const REDIS_URL = process.env.REDIS_URL;

// In many hosted environments there is no local Redis; if REDIS_URL points to localhost
// or 127.0.0.1 we should not attempt a network connection (it will fail on the host).
const isLocalRedis = (url) => {
	if (!url) return false;
	try {
		const lower = url.toLowerCase();
		return lower.includes('127.0.0.1') || lower.includes('localhost');
	} catch (e) {
		return false;
	}
};

// Simple in-memory fallback implementing the small subset of Redis commands used in this app
const makeInMemoryRedis = () => {
	const store = new Map();
	return {
		get: async (key) => {
			const val = store.get(key);
			return val === undefined ? null : val;
		},
		set: async (key, value, ...args) => {
			// support EX TTL but ignore it for the in-memory fallback
			store.set(key, value);
			return "OK";
		},
		del: async (key) => {
			return store.delete(key) ? 1 : 0;
		},
	};
};

let client;
if (REDIS_URL && !isLocalRedis(REDIS_URL)) {
	client = new Redis(REDIS_URL);
	// attach handlers early to avoid unhandled error events
	client.on("connect", () => console.log("Redis: connected to", REDIS_URL));
	client.on("ready", () => console.log("Redis: ready"));
	client.on("error", (err) => console.warn("Redis error:", err.message || err));
} else {
	if (REDIS_URL && isLocalRedis(REDIS_URL)) {
		console.warn("REDIS_URL points to localhost; skipping remote Redis and using in-memory fallback.");
	} else {
		console.warn("REDIS_URL not set — using in-memory fallback for Redis. Caches will be ephemeral.");
	}
	client = makeInMemoryRedis();
}

export const redis = client;
