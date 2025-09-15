const express = require("express");
const router = express.Router();
const Lecturer = require("../models/Lecturer");
const User = require("../models/User");
const Student = require("../models/Student");
const Classroom = require("../models/Classroom");
const bcrypt = require("bcryptjs");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

/**
 * ==============================
 * Get all lecturers (admin only)
 * GET /api/lecturers
 * ==============================
 */
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const lecturers = await Lecturer.find()
      .populate("user", "name email")
      .populate("assignedClasses", "className");
    res.json(lecturers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Get lecturer's own profile + classes
 * GET /api/lecturers/me
 * ==============================
 */
router.get("/me", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ user: req.user._id })
      .populate("user", "name email")
      .populate("assignedClasses", "className");

    if (!lecturer) {
      return res.status(404).json({ message: "Lecturer profile not found" });
    }

    res.json(lecturer);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Self-update lecturer profile
 * PUT /api/lecturers/me
 * ==============================
 */
router.put("/me", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ user: req.user._id });
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    if (req.body.department) lecturer.department = req.body.department;
    await lecturer.save();

    const user = await User.findById(req.user._id);
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    await user.save();

    res.json({
      message: "Profile updated",
      lecturer: await lecturer.populate("user", "name email")
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Lecturer change password
 * PUT /api/lecturers/me/password
 * ==============================
 */
router.put("/me/password", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ message: "Old and new password required" });

    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(oldPassword);
    if (!isMatch) return res.status(400).json({ message: "Old password incorrect" });

    user.password = newPassword;
    await user.save();
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Get single lecturer by ID (admin only)
 * GET /api/lecturers/:id
 * ==============================
 */
router.get("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id)
      .populate("user", "name email")
      .populate("assignedClasses", "className");
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });
    res.json(lecturer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Update lecturer (admin only)
 * PUT /api/lecturers/:id
 * ==============================
 */
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id).populate("user");
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    if (req.body.department) lecturer.department = req.body.department;
    await lecturer.save();

    const user = await User.findById(lecturer.user._id);
    if (req.body.name) user.name = req.body.name;
    if (req.body.email) user.email = req.body.email;
    await user.save();

    res.json({ message: "Lecturer updated successfully", lecturer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Create lecturer (admin only)
 * POST /api/lecturers
 * ==============================
 */
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const user = new User({ name, email, password, role: "lecturer" });
    await user.save();

    const lecturer = new Lecturer({ user: user._id, department });
    await lecturer.save();

    res.status(201).json(await lecturer.populate("user", "name email role"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Delete lecturer (admin only)
 * DELETE /api/lecturers/:id
 * ==============================
 */
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    await User.findByIdAndDelete(lecturer.user);
    await lecturer.deleteOne();

    res.json({ message: "Lecturer and linked user deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Assign class to lecturer (admin only)
 * PATCH /api/lecturers/:lecturerId/assign-class
 * ==============================
 */
router.patch("/:lecturerId/assign-class", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { classId } = req.body;
    if (!classId) return res.status(400).json({ message: "classId is required" });

    const lecturer = await Lecturer.findById(req.params.lecturerId);
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    const classroom = await Classroom.findById(classId);
    if (!classroom) return res.status(404).json({ message: "Classroom not found" });

    if (!lecturer.assignedClasses.includes(classId)) {
      lecturer.assignedClasses.push(classId);
      await lecturer.save();
    }

    if (!classroom.lecturers.includes(lecturer._id)) {
      classroom.lecturers.push(lecturer._id);
      await classroom.save();
    }

    res.json({
      message: "Class assigned to lecturer successfully",
      lecturer: await lecturer.populate("assignedClasses"),
      classroom: await classroom.populate({
        path: "lecturers",
        populate: { path: "user", select: "name email" }
      })
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * Remove class from lecturer (admin only)
 * PATCH /api/lecturers/:lecturerId/remove-class
 * ==============================
 */
router.patch("/:lecturerId/remove-class", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { classId } = req.body;
    const lecturer = await Lecturer.findById(req.params.lecturerId);
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    // Remove class from lecturer
    lecturer.assignedClasses = lecturer.assignedClasses.filter(
      cid => String(cid) !== String(classId)
    );
    await lecturer.save();

    // Also remove lecturer from classroom
    const classroom = await Classroom.findById(classId);
    if (classroom) {
      classroom.lecturers = classroom.lecturers.filter(
        lid => String(lid) !== String(lecturer._id)
      );
      await classroom.save();
    }

    res.json({
      message: "Class removed from lecturer",
      lecturer: await lecturer.populate("assignedClasses"),
      classroom: classroom
        ? await classroom.populate({
            path: "lecturers",
            populate: { path: "user", select: "name email" }
          })
        : null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * ==============================
 * List students in a class (lecturer only)
 * GET /api/lecturers/:lecturerId/class/:classId/students
 * ==============================
 */
router.get("/:lecturerId/class/:classId/students", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const { lecturerId, classId } = req.params;

    const lecturer = await Lecturer.findById(lecturerId).populate("assignedClasses");
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    if (!lecturer.assignedClasses.some(c => String(c._id) === classId)) {
      return res.status(403).json({ message: "Forbidden: not assigned to this class" });
    }

    const classroom = await Classroom.findById(classId).populate({
      path: "students",
      select: "name email age course className",
      populate: { path: "user", select: "name email" }
    });

    if (!classroom) return res.status(404).json({ message: "Classroom not found" });
    res.json(classroom.students);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;