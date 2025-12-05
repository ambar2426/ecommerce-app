import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
	try {
		const products = await Product.find({}); // find all products
		res.json({ products });
	} catch (error) {
		console.log("Error in getAllProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getFeaturedProducts = async (req, res) => {
	try {
		let featuredProducts = await redis.get("featured_products");
		if (featuredProducts) {
			return res.json(JSON.parse(featuredProducts));
		}

		// if not in redis, fetch from mongodb
		// .lean() is gonna return a plain javascript object instead of a mongodb document
		// which is good for performance
		featuredProducts = await Product.find({ isFeatured: true }).lean();

		if (!featuredProducts) {
			return res.status(404).json({ message: "No featured products found" });
		}

		// store in redis for future quick access

		await redis.set("featured_products", JSON.stringify(featuredProducts));

		res.json(featuredProducts);
	} catch (error) {
		console.log("Error in getFeaturedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const createProduct = async (req, res) => {
	// Clean, merged implementation
	try {
		const { name, description, price, image, category } = req.body;

		// Basic validation
		if (!name || !description || price == null || !category) {
			return res.status(400).json({ message: "Missing required product fields" });
		}

		let cloudinaryResponse = null;

		// Only attempt upload if an image was provided and Cloudinary is configured
		if (image) {
			const apiKey = process.env.CLOUDINARY_API_KEY || "";
			const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
			const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "";

			// Basic heuristic to detect placeholder values
			const looksLikePlaceholder = (val) => {
				const v = String(val).toLowerCase();
				return v.includes("your_") || v.includes("replace") || v.includes("changeme") || v.includes("example");
			};

			if (!apiKey || !apiSecret || !cloudName || looksLikePlaceholder(apiKey) || looksLikePlaceholder(apiSecret) || looksLikePlaceholder(cloudName)) {
				console.warn("Cloudinary credentials missing or look like placeholders; skipping image upload");
			} else {
				try {
					cloudinaryResponse = await cloudinary.uploader.upload(image, { folder: "products" });
				} catch (uploadError) {
					console.error("Cloudinary upload failed:", uploadError.message);
					// Log the error but continue — create the product without an image
					cloudinaryResponse = null;
				}
			}
		}

		// Determine which image to store:
		// - prefer Cloudinary secure_url when available
		// - otherwise, if the client provided a base64 image, store that as a fallback
		const imageToStore = cloudinaryResponse?.secure_url ? cloudinaryResponse.secure_url : image ? image : "";

		if (!cloudinaryResponse && image) {
			console.warn("Saving provided base64 image to DB as Cloudinary upload was skipped/failed");
		}

		const product = await Product.create({
			name,
			description,
			price,
			image: imageToStore,
			category,
		});

		res.status(201).json(product);
	} catch (error) {
		console.log("Error in createProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const deleteProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);

		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}

		if (product.image) {
			const publicId = product.image.split("/").pop().split(".")[0];
			try {
				await cloudinary.uploader.destroy(`products/${publicId}`);
				console.log("deleted image from cloduinary");
			} catch (error) {
				console.log("error deleting image from cloduinary", error);
			}
		}

		await Product.findByIdAndDelete(req.params.id);

		res.json({ message: "Product deleted successfully" });
	} catch (error) {
		console.log("Error in deleteProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getRecommendedProducts = async (req, res) => {
	try {
		const products = await Product.aggregate([
			{
				$sample: { size: 4 },
			},
			{
				$project: {
					_id: 1,
					name: 1,
					description: 1,
					image: 1,
					price: 1,
				},
			},
		]);

		res.json(products);
	} catch (error) {
		console.log("Error in getRecommendedProducts controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const getProductsByCategory = async (req, res) => {
	const { category } = req.params;
	try {
		const products = await Product.find({ category });
		res.json({ products });
	} catch (error) {
		console.log("Error in getProductsByCategory controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

export const toggleFeaturedProduct = async (req, res) => {
	try {
		const product = await Product.findById(req.params.id);
		if (product) {
			product.isFeatured = !product.isFeatured;
			const updatedProduct = await product.save();
			await updateFeaturedProductsCache();
			res.json(updatedProduct);
		} else {
			res.status(404).json({ message: "Product not found" });
		}
	} catch (error) {
		console.log("Error in toggleFeaturedProduct controller", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
};

async function updateFeaturedProductsCache() {
	try {
		// The lean() method  is used to return plain JavaScript objects instead of full Mongoose documents. This can significantly improve performance

		const featuredProducts = await Product.find({ isFeatured: true }).lean();
		await redis.set("featured_products", JSON.stringify(featuredProducts));
	} catch (error) {
		console.log("error in update cache function");
	}
}
