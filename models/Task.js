const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: {
    type: String
  },
  deadline: {
    type: Date
  },
  class: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Classroom", // Make sure this matches your classroom model name
    required: true 
  },
  lecturer: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Lecturer", // Make sure this matches your lecturer model name
    required: true 
  },
  maxGrade: {
    type: Number,
    default: 100
  },
  instructions: {
    type: String
  },
  attachments: [{
    filename: String,
    url: String,
    uploadedAt: { type: Date, default: Date.now }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Virtual to check if task is overdue
taskSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  return new Date() > this.deadline;
});

// Virtual to get days until deadline
taskSchema.virtual('daysUntilDeadline').get(function() {
  if (!this.deadline) return null;
  const now = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// Method to get submission count for this task
taskSchema.methods.getSubmissionCount = async function() {
  const Submission = mongoose.model('Submission');
  return await Submission.countDocuments({ task: this._id });
};

// Index for better query performance
taskSchema.index({ lecturer: 1, class: 1 });
taskSchema.index({ deadline: 1 });
taskSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Task", taskSchema);