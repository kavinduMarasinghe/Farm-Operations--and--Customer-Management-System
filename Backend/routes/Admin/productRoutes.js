const express = require("express");
const router = express.Router();

const { createProduct, deleteProduct, getAllProducts, updateProduct } = require("../../controllers/Admin/productController");

// POST -> create product
router.post("/", createProduct);

// GET -> get all products
router.get("/", getAllProducts);

// PUT -> update product
router.put("/:id", updateProduct);

// DELETE -> delete a produst
router.delete("/:id", deleteProduct);

module.exports = router;
