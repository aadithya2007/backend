const Product = require("../Models/ProductModel");

async function getProducts(req, res) {
  try {
    const filter = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    // If a search query is provided, match name or description (case-insensitive)
    if (req.query.search) {
      const q = req.query.search.trim();
      if (q.length > 0) {
        const searchRegex = new RegExp(q, "i");
        filter.$or = [{ name: searchRegex }, { description: searchRegex }];
      }
    }

    const products = await Product.find(filter).populate("category").sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Could not fetch products.", error: error.message });
  }
}

async function createProduct(req, res) {
  try {
    const product = await Product.create(req.body);
    const populatedProduct = await product.populate("category");
    res.status(201).json(populatedProduct);
  } catch (error) {
    res.status(500).json({ message: "Could not create product.", error: error.message });
  }
}

async function updateProduct(req, res) {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category");

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Could not update product.", error: error.message });
  }
}

async function deleteProduct(req, res) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found." });
    }

    res.json({ message: "Product deleted." });
  } catch (error) {
    res.status(500).json({ message: "Could not delete product.", error: error.message });
  }
}

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
