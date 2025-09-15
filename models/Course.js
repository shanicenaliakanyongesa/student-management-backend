const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true, trim: true },
  code: { type: String, trim: true },
  description: { type: String, default: "", trim: true },
  credits: { type: Number, default: 3 },

  // ✅ Link to Lecturer & Class
  lecturer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  class: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },

  createdAt: { type: Date, default: Date.now },
});

// Virtual for better display
courseSchema.virtual("displayName").get(function () {
  return this.code ? `${this.code} - ${this.title}` : this.title;
});

courseSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Course", courseSchema);
