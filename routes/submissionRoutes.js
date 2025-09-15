const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const Task = require("../models/Task");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// POST /api/submissions/:taskId - Submit answer for a task
router.post("/:taskId", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { answer } = req.body;

    if (!answer || answer.trim() === "") {
      return res.status(400).json({ message: "Answer is required" });
    }

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.deadline && new Date() > task.deadline) {
      return res.status(400).json({ message: "Deadline has passed" });
    }

    const existingSubmission = await Submission.findOne({
      task: taskId,
      student: req.user.id,
    });

    if (existingSubmission) {
      existingSubmission.answer = answer;
      existingSubmission.submittedAt = new Date();
      const updatedSubmission = await existingSubmission.save();

      const populatedSubmission = await Submission.findById(updatedSubmission._id)
        .populate("task", "title description deadline")
        .populate("student", "name email");

      return res.json({
        message: "Submission updated successfully",
        submission: populatedSubmission,
      });
    }

    const newSubmission = new Submission({
      task: taskId,
      student: req.user.id,
      answer: answer.trim(),
      submittedAt: new Date(),
    });

    const savedSubmission = await newSubmission.save();

    const populatedSubmission = await Submission.findById(savedSubmission._id)
      .populate("task", "title description deadline")
      .populate("student", "name email");

    res.status(201).json({
      message: "Submission created successfully",
      submission: populatedSubmission,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    res.status(500).json({
      message: "Failed to submit answer",
      error: error.message,
    });
  }
});

// GET /api/submissions/my - Get student's own submissions
router.get("/my", protect, async (req, res) => {
  try {
    const submissions = await Submission.find({ student: req.user.id })
      .populate("task", "title description deadline")
      .populate({
        path: "task",
        populate: { path: "class", select: "className course" },
      })
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching student submissions:", error);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

// GET /api/submissions/task/:taskId - Get all submissions for a specific task (lecturer)
router.get("/task/:taskId", protect, async (req, res) => {
  try {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (task.lecturer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view submissions" });
    }

    const submissions = await Submission.find({ task: taskId })
      .populate("student", "name email studentId")
      .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching task submissions:", error);
    res.status(500).json({ message: "Failed to fetch submissions" });
  }
});

// GET /api/submissions/:id - Get specific submission
router.get("/:id", protect, async (req, res) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate("task", "title description deadline")
      .populate("student", "name email studentId")
      .populate({
        path: "task",
        populate: { path: "lecturer", select: "name email" },
      });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const isStudent = req.user.id === submission.student._id.toString();
    const isLecturer = req.user.id === submission.task.lecturer._id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isStudent && !isLecturer && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to view this submission" });
    }

    res.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ message: "Failed to fetch submission" });
  }
});

// PUT /api/submissions/:id/grade - Grade a submission (lecturer)
router.put("/:id/grade", protect, async (req, res) => {
  try {
    const { grade, feedback } = req.body;

    const submission = await Submission.findById(req.params.id).populate("task");
    if (!submission) return res.status(404).json({ message: "Submission not found" });

    if (submission.task.lecturer.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to grade this submission" });
    }

    if (grade !== undefined) submission.grade = grade;
    if (feedback !== undefined) submission.feedback = feedback;
    submission.gradedAt = new Date();
    submission.gradedBy = req.user.id;

    const updatedSubmission = await submission.save();

    const populatedSubmission = await Submission.findById(updatedSubmission._id)
      .populate("task", "title")
      .populate("student", "name email");

    res.json({
      message: "Submission graded successfully",
      submission: populatedSubmission,
    });
  } catch (error) {
    console.error("Error grading submission:", error);
    res.status(500).json({ message: "Failed to grade submission" });
  }
});

module.exports = router;
