const express = require("express");
const Classroom = require("../models/Classroom");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

/**
 * @route   GET /api/classrooms
 * @desc    Get classrooms (optionally filter by course)
 * @access  Admin
 */
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const filter = {};
    if (req.query.course) {
      filter.course = req.query.course;
    }

    const classrooms = await Classroom.find(filter)
      .populate("course", "title code")
      .populate({
        path: "lecturers",
        populate: { path: "user", select: "name email" },
      })
      .populate("students", "name email");

    res.json(classrooms);
  } catch (err) {
    console.error("❌ Error fetching classrooms:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   GET /api/classrooms/:id
 * @desc    Get single classroom
 * @access  Admin
 */
router.get("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id)
      .populate("course", "title code")
      .populate({
        path: "lecturers",
        populate: { path: "user", select: "name email" },
      })
      .populate("students", "name email");

    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    res.json(classroom);
  } catch (err) {
    console.error("❌ Error fetching classroom:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   POST /api/classrooms
 * @desc    Create new classroom
 * @access  Admin
 */
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { className, course, lecturers, students } = req.body;

    if (!className || !course) {
      return res.status(400).json({ message: "className and course are required" });
    }

    const newClassroom = new Classroom({
      className,
      course,
      lecturers: lecturers || [],
      students: students || [],
    });

    const saved = await newClassroom.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error creating classroom:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/classrooms/:id
 * @desc    Update classroom
 * @access  Admin
 */
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { className, course, lecturers, students } = req.body;

    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    if (className) classroom.className = className;
    if (course) classroom.course = course;
    if (lecturers) classroom.lecturers = lecturers;
    if (students) classroom.students = students;

    const updated = await classroom.save();
    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating classroom:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   DELETE /api/classrooms/:id
 * @desc    Delete classroom
 * @access  Admin
 */
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const classroom = await Classroom.findById(req.params.id);
    if (!classroom) {
      return res.status(404).json({ message: "Classroom not found" });
    }

    await classroom.deleteOne();
    res.json({ message: "Classroom deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting classroom:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
