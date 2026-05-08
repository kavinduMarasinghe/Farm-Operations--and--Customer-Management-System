const CropYield = require("../models/CropYield.js");

// GET all yields
const getYields = async (req, res) => {
  try {
    const yields = await CropYield.find().sort({ harvestDate: -1 });
    res.json(
      yields.map((y) => ({
        id: y._id.toString(),
        crop: y.crop,
        field: y.field,
        season: y.season,
        year: y.year,
        yield: y.yield,
        quality: y.quality,
        harvestDate: y.harvestDate,
        notes: y.notes,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: "Error fetching yields", error });
  }
};

// POST new yield
const addYield = async (req, res) => {
  try {
    const { crop, field, season, year, yield: yieldAmount, quality, harvestDate, notes } = req.body;

    const newYield = new CropYield({
      crop,
      field,
      season,
      year,
      yield: yieldAmount,
      quality,
      harvestDate,
      notes,
    });

    await newYield.save();

    res.status(201).json({
      id: newYield._id.toString(),
      crop: newYield.crop,
      field: newYield.field,
      season: newYield.season,
      year: newYield.year,
      yield: newYield.yield,
      quality: newYield.quality,
      harvestDate: newYield.harvestDate,
      notes: newYield.notes,
    });
  } catch (error) {
    res.status(400).json({ message: "Error adding yield", error });
  }
};

// PUT update yield
const updateYield = async (req, res) => {
  try {
    const updated = await CropYield.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated) return res.status(404).json({ message: "Yield record not found" });

    res.json({
      id: updated._id.toString(),
      crop: updated.crop,
      field: updated.field,
      season: updated.season,
      year: updated.year,
      yield: updated.yield,
      quality: updated.quality,
      harvestDate: updated.harvestDate,
      notes: updated.notes,
    });
  } catch (error) {
    res.status(400).json({ message: "Error updating yield", error });
  }
};

// DELETE yield
const deleteYield = async (req, res) => {
  try {
    const deleted = await CropYield.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Yield record not found" });

    res.json({ message: "Yield deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting yield", error });
  }
};

module.exports = { getYields, addYield, updateYield, deleteYield };
