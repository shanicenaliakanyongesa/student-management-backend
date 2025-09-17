const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize app
const app = express();

// ✅ Proper CORS setup
app.use(cors({
  origin: [
    "http://localhost:3000",       // local dev
    "https://your-frontend-url.com" // deployed frontend (if any)
  ],
 methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
 credentials: true, // allow cookies/auth headers
}));

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Import routes
const authRoutes = require("./routes/authRoutes");
const studentRoutes = require("./routes/studentRoutes");
const courseRoutes = require("./routes/courseRoutes");
const classroomRoutes = require("./routes/classroomRoutes");
const lecturerRoutes = require("./routes/lecturerRoutes");
const adminRoutes = require("./routes/adminRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/TaskRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/lecturers", lecturerRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/submissions", submissionRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
