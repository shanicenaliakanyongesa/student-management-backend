const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: { type: Number },
  course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
  enrolledDate: { type: Date, default: Date.now },
  assignedLecturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecturer", // ✅ Reference to Lecturer document, not User
  },
});

module.exports = mongoose.model("Student", studentSchema);