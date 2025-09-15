// models/Lecturer.js (update)
const mongoose = require("mongoose");

const lecturerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  department: { type: String },
  assignedClasses: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }]
});

module.exports = mongoose.model("Lecturer", lecturerSchema);
