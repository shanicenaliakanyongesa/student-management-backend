const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// GET /api/tasks/my - tasks created by the lecturer
router.get("/my", protect, async (req, res) => {
  try {
    const tasks = await Task.find({ lecturer: req.user.id })
      .populate("class", "className course")
      .populate({
        path: "class",
        populate: { path: "course", select: "title" },
      })
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching lecturer tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});


// GET /api/tasks - all tasks (students see their classes)
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "student") {
      query.class = { $in: req.user.enrolledClasses };
    }

    const tasks = await Task.find(query)
      .populate("class", "className course")
      .populate("lecturer", "name email")
      .populate({
        path: "class",
        populate: { path: "course", select: "title" }
      })
      .sort({ deadline: 1 });

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Failed to fetch tasks" });
  }
});

// POST /api/tasks - create new task (lecturer only)
router.post("/", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const { title, description, deadline, classId } = req.body;
    if (!title || !classId) return res.status(400).json({ message: "Title and class are required" });

    const newTask = new Task({
      title,
      description,
      deadline: deadline ? new Date(deadline) : null,
      class: classId,
      lecturer: req.user.id
    });

    const savedTask = await newTask.save();

    const populatedTask = await Task.findById(savedTask._id)
      .populate("class", "className course")
      .populate({ path: "class", populate: { path: "course", select: "title" } });

    res.status(201).json({ message: "Task created successfully", task: populatedTask });

  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ message: "Failed to create task", error: error.message });
  }
});

// PUT /api/tasks/:id - update task
router.put("/:id", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.lecturer.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    const { title, description, deadline, classId } = req.body;
    if (title) task.title = title;
    if (description !== undefined) task.description = description;
    if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : null;
    if (classId) task.class = classId;

    const updatedTask = await task.save();

    const populatedTask = await Task.findById(updatedTask._id)
      .populate("class", "className course")
      .populate({ path: "class", populate: { path: "course", select: "title" } });

    res.json({ message: "Task updated successfully", task: populatedTask });

  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
});

// DELETE /api/tasks/:id - delete task
router.delete("/:id", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });
    if (task.lecturer.toString() !== req.user.id) return res.status(403).json({ message: "Not authorized" });

    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: "Task deleted successfully" });

  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
});

module.exports = router;
