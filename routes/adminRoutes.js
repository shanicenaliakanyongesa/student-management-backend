const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Student = require("../models/Student");
const Lecturer = require("../models/Lecturer");
const Course = require("../models/Course");
const Classroom = require("../models/Classroom");
const Task = require("../models/Task");
const Submission = require("../models/Submission");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ============================
// Admin Dashboard / Reports
// ============================
router.get("/reports", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const stats = {
      students: await Student.countDocuments(),
      lecturers: await Lecturer.countDocuments(),
      courses: await Course.countDocuments(),
      classes: await Classroom.countDocuments(),
      tasks: await Task.countDocuments(),
      submissions: await Submission.countDocuments(),
    };

    const latestStudents = await Student.find()
      .populate("user", "name email")
      .sort({ _id: -1 })
      .limit(5);

    const latestTasks = await Task.find()
      .sort({ _id: -1 })
      .limit(5)
      .populate("class", "className");

    res.json({ stats, latestStudents, latestTasks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// ============================
// Student Management
// ============================
router.post("/students", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, courseId, classId } = req.body;

    const user = new User({ name, email, password, role: "student" });
    await user.save();

    const student = new Student({
      user: user._id,
      course: courseId,
      class: classId,
    });
    await student.save();

    res.status(201).json(await student.populate("user", "name email"));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

router.put("/students/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/students/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================
// Lecturer Management
// ============================
router.post("/lecturers", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, department } = req.body;

    const user = new User({ name, email, password, role: "lecturer" });
    await user.save();

    const lecturer = new Lecturer({ user: user._id, department, assignedClasses: [] });
    await lecturer.save();

    res.status(201).json(await lecturer.populate("user", "name email"));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/lecturers/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });
    res.json(lecturer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/lecturers/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    await User.findByIdAndDelete(lecturer.user);
    await Lecturer.findByIdAndDelete(req.params.id);

    res.json({ message: "Lecturer deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ============================
// Classroom Management
// ============================
router.post("/classrooms", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { className, courseId } = req.body;
    const classroom = new Classroom({ className, course: courseId });
    await classroom.save();
    res.status(201).json(classroom);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET classrooms by course
router.get("/classrooms", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { course } = req.query;
    const query = course ? { course } : {};
    const classrooms = await Classroom.find(query).populate("course", "title code");
    res.json(classrooms);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// Assign lecturer to classroom
router.patch("/classrooms/:id/assign-lecturer", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { lecturerId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    const lecturer = await Lecturer.findById(lecturerId);

    if (!classroom || !lecturer) return res.status(404).json({ message: "Classroom or Lecturer not found" });

    classroom.lecturer = lecturerId;
    await classroom.save();

    if (!lecturer.assignedClasses.includes(classroom._id)) {
      lecturer.assignedClasses.push(classroom._id);
      await lecturer.save();
    }

    res.json({ classroom, lecturer });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add student to classroom
router.patch("/classrooms/:id/add-student", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { studentId } = req.body;
    const classroom = await Classroom.findById(req.params.id);
    const student = await Student.findById(studentId);

    if (!classroom || !student) return res.status(404).json({ message: "Classroom or Student not found" });

    student.class = classroom._id;
    await student.save();

    if (!classroom.students.includes(student._id)) {
      classroom.students.push(student._id);
      await classroom.save();
    }

    res.json({ message: "Student added", classroom, student });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
