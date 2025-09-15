const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  task: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Task", 
    required: true 
  },
  student: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Student", // or "User" depending on your user model structure
    required: true 
  },
  answer: { 
    type: String, 
    required: true 
  },
  submittedAt: { 
    type: Date, 
    default: Date.now 
  },
  grade: { 
    type: Number,
    min: 0,
    max: 100 // Adjust based on your grading system
  },
  feedback: {
    type: String
  },
  gradedAt: {
    type: Date
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lecturer" // or "User"
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

// Index to ensure one submission per student per task
submissionSchema.index({ task: 1, student: 1 }, { unique: true });

// Virtual for checking if submission is graded
submissionSchema.virtual('isGraded').get(function() {
  return this.grade !== undefined && this.grade !== null;
});

// Method to check if submission is late
submissionSchema.methods.isLate = async function() {
  await this.populate('task', 'deadline');
  if (!this.task.deadline) return false;
  return this.submittedAt > this.task.deadline;
};

module.exports = mongoose.model("Submission", submissionSchema);