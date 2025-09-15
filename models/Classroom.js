const mongoose = require("mongoose");

const classroomSchema = new mongoose.Schema({
  className: { type: String, required: true }, 
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "Student" }],
  lecturers: [{ type: mongoose.Schema.Types.ObjectId, ref: "Lecturer" }], // ✅ Reference Lecturer documents directly
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Classroom", classroomSchema);