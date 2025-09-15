// routes/assignmentRoutes.js
const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

// ==============================
// Teacher creates assignment
// ==============================
router.post("/", protect, authorizeRoles("lecturer"), async (req, res) => {
  const { title, description, deadline, classId } = req.body;

  try {
    const assignment = await Assignment.create({
      title,
      description,
      deadline,
      class: classId,
      lecturer: req.user._id
    });

    res.status(201).json(assignment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get assignments for a class
// ==============================
router.get("/class/:classId", protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ class: req.params.classId })
      .populate("lecturer", "user")
      .sort({ deadline: 1 });

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get assignments for the logged-in teacher
// ==============================
router.get("/my", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const assignments = await Assignment.find({ lecturer: req.user._id })
      .populate("class");

    res.json(assignments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Student submits assignment
// ==============================
router.post("/:assignmentId/submit", protect, authorizeRoles("student"), async (req, res) => {
  const { answer } = req.body;

  try {
    // Validate student ID
    if (!req.user.studentId) {
      return res.status(400).json({ message: "Student ID not found in token" });
    }

    const submission = await Submission.create({
      assignment: req.params.assignmentId,
      student: req.user.studentId,
      answer
    });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Teacher grades a submission
// ==============================
router.patch("/:submissionId/grade", protect, authorizeRoles("lecturer"), async (req, res) => {
  const { grade, feedback } = req.body;

  try {
    const submission = await Submission.findById(req.params.submissionId);
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    submission.grade = grade;
    submission.feedback = feedback;
    await submission.save();

    res.json(submission);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Get all submissions for an assignment (teacher only)
// ==============================
router.get("/:assignmentId/submissions", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment: req.params.assignmentId })
      .populate("student", "name email");

    res.json(submissions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
