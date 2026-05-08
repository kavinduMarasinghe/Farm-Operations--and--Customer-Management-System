// Backend/controllers/Admin/cottageController.js
const { default: mongoose } = require("mongoose");
const Cottage = require("../../models/Admin/Cottage");

// Create cottage
const createCottage = async (req, res) => {
  const { name, location, capacity, pricePerNight, image, description, amenities, available } = req.body;

  if (!name || !location || !capacity || !pricePerNight || !image) {
    return res.status(400).json({ success: false, message: "Please provide all required fields" });
  }

  try {
    const newCottage = new Cottage({
      name,
      location,
      capacity,
      pricePerNight,
      image,
      description,
      amenities,
      available
    });

    await newCottage.save();
    res.status(201).json({ success: true, data: newCottage });
  } catch (error) {
    console.error("Error in Creating Cottage:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get all cottages
const getAllCottages = async (req, res) => {
  try {
    const cottages = await Cottage.find({});
    res.status(200).json({ success: true, data: cottages });
  } catch (error) {
    console.error("Error Fetching Cottages:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

const getCottageById = async (req, res) => {
  try {
    const cottage = await Cottage.findById(req.params.id);
    if (!cottage) {
      return res.status(404).json({ success: false, message: "Cottage not found" });
    }
    res.status(200).json(cottage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update cottage
const updateCottage = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ success: false, message: "Invalid Cottage ID" });
  }

  try {
    const updatedCottage = await Cottage.findByIdAndUpdate(id, req.body, { new: true });
    res.status(200).json({ success: true, data: updatedCottage });
  } catch (error) {
    console.error("Error Updating Cottage:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete cottage
const deleteCottage = async (req, res) => {
  const { id } = req.params;
  try {
    await Cottage.findByIdAndDelete(id);
    res.status(200).json({ success: true, message: "Cottage Deleted" });
  } catch (error) {
    console.error("Error Deleting Cottage:", error.message);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

module.exports = { createCottage, getAllCottages, updateCottage, deleteCottage, getCottageById };
