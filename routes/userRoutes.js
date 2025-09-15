const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ==============================
// Admin: create a new user
// ==============================
router.post("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // check duplicate
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already exists" });

    const user = new User({ name, email, password, role });
    await user.save();

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Admin: get all users
// ==============================
router.get("/", protect, authorizeRoles("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==============================
// Logged-in user profile
// ==============================
router.get("/me", protect, async (req, res) => {
  res.json(req.user);
});

module.exports = router;
