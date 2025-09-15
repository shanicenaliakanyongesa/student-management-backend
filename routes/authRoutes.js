// routes/authRoutes.js
const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();

const User = require("../models/User");
const Student = require("../models/Student");
const Lecturer = require("../models/Lecturer");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Helper: sign token
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

// ===============================
// ADMIN-ONLY REGISTER ENDPOINT
// ===============================
// routes/authRoutes.js
router.post("/register", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role, department, courseId, classId, age } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "name, email, password and role are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already in use" });

    const user = new User({ name, email, password, role });
    await user.save();

    let profile = null;

    if (role === "student") {
      if (!courseId) {
        return res.status(400).json({ message: "courseId is required for students" });
      }

      profile = new Student({
        user: user._id,
        name: name,        // ✅ added
        email: email,      // ✅ added
        age: age || null,
        course: courseId,  // ✅ must be valid ObjectId
        class: classId || null,
      });

      await profile.save();
    } else if (role === "lecturer") {
      profile = new Lecturer({
        user: user._id,
        department: department || "",
        assignedClasses: [],
      });
      await profile.save();
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      profile,
      token,
    });
  } catch (err) {
    console.error("❌ Register error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: "Validation failed", errors: err.errors });
    }
    res.status(500).json({ message: err.message });
  }
});


// ===============================
// LOGIN ENDPOINT
// ===============================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Provide email & password" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user._id);

    res.json({
      user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      token,
    });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
