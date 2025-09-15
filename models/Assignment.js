// models/Assignment.js
const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  deadline: { type: Date },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom", required: true },
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "Lecturer", required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Assignment", assignmentSchema);
