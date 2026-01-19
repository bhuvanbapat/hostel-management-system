// backend/routes/auth.routes.js

const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Student = require("../models/student.model");
const { JWT_SECRET, authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

// -------------------
// LOGIN
// -------------------
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({
      username: username.toLowerCase(),
    }).populate("studentProfile");

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const payload = {
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        studentId: user.studentProfile ? user.studentProfile.studentId : null,
      },
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "2h" });

    res.json({ token });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Error logging in." });
  }
});

// -------------------
// ADMIN REGISTER USER (Protected - Admin Only)
// -------------------
router.post("/register", authMiddleware, isAdmin, async (req, res) => {
  try {
    const { username, password, role, studentId } = req.body;


    let studentProfile = null;

    if (role === "student") {
      if (!studentId) {
        return res
          .status(400)
          .json({ message: "Student ID is required for student role." });
      }

      studentProfile = await Student.findOne({
        studentId: studentId.toUpperCase(),
      });

      if (!studentProfile) {
        return res.status(400).json({ message: "Student ID not found." });
      }
    }

    const existing = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existing) {
      return res.status(400).json({ message: "Username already taken." });
    }

    const user = new User({
      username: username.toLowerCase(),
      password, // hashed in schema
      plainPassword: password, // store readable password
      role,
      studentProfile: studentProfile ? studentProfile._id : null,
    });

    await user.save();

    res.json({
      message: "User registered successfully.",
      login: {
        username: user.username,
        password: user.plainPassword,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res
      .status(500)
      .json({ message: "Error registering user.", error: err.message });
  }
});

// -------------------
// CHANGE PASSWORD (for logged-in user)
// PUT /api/auth/change-password
// Body: { oldPassword, newPassword }
// -------------------
router.put("/change-password", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Old and new passwords are required." });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters." });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found." });

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect." });
    }

    user.password = newPassword; // will be hashed by pre-save
    user.plainPassword = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Error updating password." });
  }
});

module.exports = router;
