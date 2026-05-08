const mongoose = require("mongoose");

const cropYieldSchema = new mongoose.Schema(
  {
    crop: { type: String, required: true },
    field: { type: String, required: true },
    season: { type: String, required: true },
    year: { type: Number, required: true },
    yield: { type: Number, required: true }, // bushels/acre
    quality: {
      type: String,
      enum: ["excellent", "good", "fair", "poor"],
      default: "good",
    },
    harvestDate: { type: Date, required: true },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CropYield", cropYieldSchema);
