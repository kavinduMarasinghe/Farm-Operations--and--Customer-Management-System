const { default: mongoose } = require("mongoose");
const Product = require("../../models/Admin/Product");

//create a product
const createProduct = async (req, res) => {
  const { name, price, category, quantity, image } = req.body;

  if (!name || !price || !category || !quantity || !image) {
    return res.status(400).json({ success: false, message: "Please provide all fields" });
  }

  try {
    const newProduct = new Product({ name, price, category, quantity, image });
    await newProduct.save();
    res.status(201).json({ success: true, data: newProduct });
  } catch (error) {
    console.error("Error in Creating Product:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete a product by ID
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        await Product.findByIdAndDelete(id);
        res.status(200).json({ success: true, message: "Product Deleted" });
    } catch (error) {
        res.status(404).json({ success: false, message: "Product not Found!" });
    }
};

//Get all products
const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});
    res.status(200).json({success: true, data: products});
  } catch (error) {
    console.log("Error Fetching Products:", error.message);
    res.status(500).json({success: false, message: "Server Error"});
  }
};

//Update a Product
const updateProduct = async (req, res) => {
  const {id} = req.params;

  const product = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({success: false, message: "Invalid Product ID"})
  }

  try {
    const updatedProduct = await Product.findByIdAndUpdate(id, product, {new: true});
    res.status(200).json({success: true, data: updatedProduct});

  }catch (error) {
    res.status(500).json({success: false, message: "Server Error"});
  }
};

module.exports = { createProduct, deleteProduct, getAllProducts, updateProduct };
