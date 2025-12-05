import Redis from "ioredis";
import 'dotenv/config';

// Use REDIS_URL from env (set by render/upstash) or fall back to undefined
const REDIS_URL = process.env.REDIS_URL;

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
if (REDIS_URL) {
	client = new Redis(REDIS_URL);
	client.on("connect", () => console.log("Redis: connected to", REDIS_URL));
	client.on("error", (err) => console.warn("Redis error:", err.message));
} else {
	console.warn("REDIS_URL not set — using in-memory fallback for Redis. Caches will be ephemeral.");
	client = makeInMemoryRedis();
}

export const redis = client;
