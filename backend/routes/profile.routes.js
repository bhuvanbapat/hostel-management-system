// routes/profile.routes.js

const express = require("express");
const multer = require("multer");
const Student = require("../models/student.model");
const User = require("../models/user.model");
const { authMiddleware, isStudent } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);
router.use(isStudent);

// ------------------------
// Multer setup
// ------------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/profile/"),
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    cb(null, `photo_${req.user.id}.${ext}`);
  },
});

const upload = multer({ storage });

// ------------------------
// GET my profile
// ------------------------
router.get("/", async (req, res) => {
  try {
    const stu = await Student.findOne({
      studentId: req.user.studentId,
    });

    if (!stu) return res.status(404).json({ message: "Student not found" });

    const user = await User.findById(req.user.id).select("-password");

    res.json({
      name: stu.name,
      studentId: stu.studentId,
      room: stu.room,
      phone: stu.phone || user.phone || "",
      address: stu.address || user.address || "",
      // Profile photo is managed by admin on Student model
      profilePhotoUrl: stu.profilePhotoUrl || "",
    });
  } catch (err) {
    res.status(500).json({ message: "Server error loading profile" });
  }
});

// ------------------------
// UPDATE profile (text fields)
// ------------------------
router.put("/", async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const stu = await Student.findOne({ studentId: req.user.studentId });
    if (!stu) return res.status(404).json({ message: "Student not found" });

    if (name) stu.name = name;
    await stu.save();

    const user = await User.findById(req.user.id);
    if (phone) user.phone = phone;
    if (address) user.address = address;
    await user.save();

    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
});

// NOTE: Profile photo upload removed for students
// Only admin can upload student photos via /api/students/photo/:id

// ------------------------
// CHANGE PASSWORD
// ------------------------
router.put("/password", async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const match = await user.comparePassword(oldPassword);
    if (!match) return res.status(400).json({ message: "Old password incorrect" });

    user.password = newPassword;
    user.plainPassword = newPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error updating password" });
  }
});

module.exports = router;
