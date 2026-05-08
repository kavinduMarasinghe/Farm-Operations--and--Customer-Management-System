            import WorkGuide from "../models/WorkGuide.js";

/**
 * GET → List work guides (with optional filters: search by title, filter by tag)
 */
export async function listWorkGuides(req, res) {
  try {
    const { q, tag } = req.query;
    const filter = {};

    // Search by title (case-insensitive)
    if (q) {
      filter.title = { $regex: q, $options: "i" };
    }

    // Filter by tag
    if (tag) {
      filter.tags = tag;
    }

    const guides = await WorkGuide.find(filter).sort({ updatedAt: -1 });
    res.json(guides);
  } catch (err) {
    console.error("❌ Error fetching work guides:", err);
    res.status(500).json({ error: "Failed to fetch work guides" });
  }
}

/**
 * GET → Single work guide by ID
 */
export async function getWorkGuide(req, res) {
  try {
    const guide = await WorkGuide.findById(req.params.id);

    if (!guide) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(guide);
  } catch (err) {
    console.error("❌ Error fetching work guide:", err);
    res.status(500).json({ error: "Failed to fetch work guide" });
  }
}

/**
 * POST → Create a new work guide
 */
export async function createWorkGuide(req, res) {
  try {
    const guide = await WorkGuide.create(req.body);
    res.status(201).json(guide);
  } catch (err) {
    console.error("❌ Error creating work guide:", err);
    res.status(400).json({ error: "Failed to create work guide" });
  }
}

/**
 * PUT → Update a work guide by ID
 */
export async function updateWorkGuide(req, res) {
  try {
    const guide = await WorkGuide.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // return updated document
    });

    if (!guide) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(guide);
  } catch (err) {
    console.error("❌ Error updating work guide:", err);
    res.status(400).json({ error: "Failed to update work guide" });
  }
}

/**
 * DELETE → Remove a work guide by ID
 */
export async function deleteWorkGuide(req, res) {
  try {
    const deleted = await WorkGuide.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error deleting work guide:", err);
    res.status(400).json({ error: "Failed to delete work guide" });
  }
}
