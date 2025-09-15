const express = require("express");
const router = express.Router();
const Course = require("../models/Course");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// CREATE course (admin only)
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { title, code, description, credits } = req.body;
    const existing = await Course.findOne({ title });
    if (existing)
      return res.status(400).json({ message: "Course already exists" });

    const course = new Course({ title, code, description, credits });
    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ all courses (any logged-in user)
router.get("/", protect, async (req, res) => {
  try {
    // Only select needed fields for dropdowns (lighter payload)
    const courses = await Course.find().select("_id title code displayName");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// READ single course
router.get("/:id", protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE course (admin)
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE course (admin)
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: "Course deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
