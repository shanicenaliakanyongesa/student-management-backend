// routes/students.js
const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Student = require("../models/Student");
const Course = require("../models/Course");
const Classroom = require("../models/Classroom");
const Lecturer = require("../models/Lecturer");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

/**
 * Helper: Find a classroom for a course
 */
async function findClassroomForCourse(courseId) {
  const courseDoc = await Course.findById(courseId).select("class");
  if (!courseDoc) return null;

  if (courseDoc.class) {
    const cls = await Classroom.findById(courseDoc.class)
      .populate({
        path: "lecturers",
        populate: { path: "user", select: "name email" }
      });
    if (cls) return cls;
  }

  // fallback: first classroom linked to this course
  return await Classroom.findOne({ course: courseId })
    .populate({
      path: "lecturers",
      populate: { path: "user", select: "name email" }
    });
}

/**
 * CREATE STUDENT (Admin only)
 */
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    let { name, email, age, course } = req.body;

    if (!course || !mongoose.Types.ObjectId.isValid(course)) {
      return res.status(400).json({ message: "Valid course ID is required" });
    }

    const selectedCourse = await Course.findById(course);
    if (!selectedCourse) return res.status(404).json({ message: "Course not found" });

    const classroom = await findClassroomForCourse(selectedCourse._id);

    // Assign first lecturer from classroom
    let assignedLecturer = null;
    if (classroom && classroom.lecturers && classroom.lecturers.length > 0) {
      assignedLecturer = classroom.lecturers[0]._id;
    }

    const student = new Student({
      name,
      email,
      age,
      course: selectedCourse._id,
      class: classroom ? classroom._id : null,
      assignedLecturer,
    });

    await student.save();

    if (classroom) {
      await Classroom.findByIdAndUpdate(classroom._id, { $addToSet: { students: student._id } });
    }

    const populatedStudent = await Student.findById(student._id)
      .populate("course", "title code")
      .populate("class", "className")
      .populate({
        path: "assignedLecturer",
        populate: { path: "user", select: "name email" },
      });

    res.status(201).json(populatedStudent);
  } catch (err) {
    console.error("❌ Error creating student:", err);

    if (err.code === 11000 && err.keyPattern?.email) {
      return res.status(400).json({ message: "Email already exists" });
    }

    res.status(500).json({ message: "Server error" });
  }
});

/**
 * GET ALL STUDENTS (Admin only)
 */
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const students = await Student.find()
      .populate("course", "title code")
      .populate("class", "className")
      .populate({
        path: "assignedLecturer",
        populate: { path: "user", select: "name email" },
      });

    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching students:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET STUDENT PROFILE (Self)
 */
router.get("/me", protect, async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate("course", "title code")
      .populate("class", "className")
      .populate({
        path: "assignedLecturer",
        populate: { path: "user", select: "name email" },
      });

    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error("❌ Error fetching student profile:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET MY STUDENTS (Lecturer only)
 */
/**
 * GET MY STUDENTS (Lecturer only)
 */
router.get("/my-students", protect, authorizeRoles("lecturer"), async (req, res) => {
  try {
    const lecturer = await Lecturer.findOne({ user: req.user._id });
    if (!lecturer) return res.status(404).json({ message: "Lecturer not found" });

    const students = await Student.find({ assignedLecturer: lecturer._id })
      .populate("course", "title code")
      .populate("class", "className")
      .populate({
        path: "assignedLecturer",
        populate: { path: "user", select: "name email" },
      });

    if (!students || students.length === 0) {
      return res.status(404).json({ message: "No students found for this lecturer." });
    }

    res.json(students);
  } catch (err) {
    console.error("❌ Error fetching my students:", err);
    res.status(500).json({ message: "Server error" });
  }
});


/**
 * UPDATE STUDENT (Admin only)
 */
router.put("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, age, course } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    const previousClassId = student.class ? student.class.toString() : null;

    if (name) student.name = name;
    if (email) student.email = email;
    if (age !== undefined) student.age = age;

    if (course && mongoose.Types.ObjectId.isValid(course)) {
      const selectedCourse = await Course.findById(course);
      if (!selectedCourse) return res.status(404).json({ message: "Course not found" });

      const classroom = await findClassroomForCourse(selectedCourse._id);

      let assignedLecturer = null;
      if (classroom && classroom.lecturers && classroom.lecturers.length > 0) {
        assignedLecturer = classroom.lecturers[0]._id;
      }

      student.course = selectedCourse._id;
      student.class = classroom ? classroom._id : null;
      student.assignedLecturer = assignedLecturer;

      if (previousClassId && (!student.class || previousClassId !== student.class.toString())) {
        await Classroom.findByIdAndUpdate(previousClassId, { $pull: { students: student._id } });
      }
      if (classroom) {
        await Classroom.findByIdAndUpdate(classroom._id, { $addToSet: { students: student._id } });
      }
    }

    await student.save();

    const populatedStudent = await Student.findById(student._id)
      .populate("course", "title code")
      .populate("class", "className")
      .populate({
        path: "assignedLecturer",
        populate: { path: "user", select: "name email" },
      });

    res.json(populatedStudent);
  } catch (err) {
    console.error("❌ Error updating student:", err);
    res.status(500).json({ message: err.message });
  }
});

/**
 * DELETE STUDENT (Admin only)
 */
router.delete("/:id", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (student.class) {
      await Classroom.findByIdAndUpdate(student.class, { $pull: { students: student._id } });
    }

    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting student:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
