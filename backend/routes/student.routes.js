const express = require("express");
const Student = require("../models/student.model");
const User = require("../models/user.model");
const Room = require("../models/room.model");
const multer = require("multer");
const path = require("path");
const { authMiddleware, isAdmin, isStudent } = require("../middleware/authMiddleware");

const router = express.Router();

/* Multer storage (uploads/) with security validation */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, "profile_" + Date.now() + path.extname(file.originalname)),
});

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max file size
  fileFilter
});


router.use(authMiddleware);

/* STUDENT SELF PROFILE */
router.get("/me", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) return res.status(400).json({ message: "Student profile not linked." });

    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.json(student);
  } catch (err) {
    console.error("GET /me error:", err);
    res.status(500).json({ message: "Error fetching student profile" });
  }
});

/* Update self */
router.put("/me", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const { name, phone, address, studentId: newStudentId } = req.body;
    // Prevent duplicate studentId if updating
    if (newStudentId && newStudentId.toUpperCase() !== student.studentId) {
      const exists = await Student.findOne({ studentId: newStudentId.toUpperCase() });
      if (exists) return res.status(400).json({ message: "Student ID already exists." });
      student.studentId = newStudentId.toUpperCase();
    }
    if (name !== undefined) student.name = name;
    if (phone !== undefined) student.phone = phone;
    if (address !== undefined) student.address = address;

    await student.save();
    res.json({ message: "Profile updated", student });
  } catch (err) {
    console.error("PUT /me error:", err);
    res.status(500).json({ message: "Error updating profile" });
  }
});

/* ADMIN ROUTES (after check) */
router.use(isAdmin);

// Upload photo - ADMIN ONLY (by MongoDB _id)
router.put("/photo/:id", upload.single("photo"), async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    if (!req.file) return res.status(400).json({ message: "No photo file provided" });

    student.profilePhotoUrl = "/uploads/" + req.file.filename;
    await student.save();
    res.json({ message: "Photo uploaded successfully", url: student.profilePhotoUrl });
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ message: "Error uploading photo" });
  }
});


/* GET all students */
router.get("/", async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Error fetching students." });
  }
});

/* CREATE student (admin) */
router.post("/", async (req, res) => {
  try {
    const { name, studentId, password, phone, address, profilePhotoUrl } = req.body;
    if (!name || !studentId || !password) {
      return res.status(400).json({ message: "Name, Student ID and password are required." });
    }

    const exists = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (exists) return res.status(400).json({ message: "Student already exists." });

    const student = new Student({
      name,
      studentId: studentId.toUpperCase(),
      phone: phone || "",
      address: address || "",
      profilePhotoUrl: profilePhotoUrl || "",
    });

    await student.save();

    const user = new User({
      username: studentId.toLowerCase(),
      password,
      plainPassword: password,
      role: "student",
      studentProfile: student._id,
    });

    await user.save();

    res.json({
      message: "Student created.",
      student,
      login: { username: user.username, password: user.plainPassword },
    });
  } catch (err) {
    console.error("Create student error:", err);
    res.status(500).json({ message: "Error creating student." });
  }
});

/* ADMIN UPDATE student (safe room handling) */
router.put("/:id", async (req, res) => {
  try {
    const { room, name, email, phone, address, profilePhotoUrl, studentId } = req.body;
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });

    // Enforce unique studentId if updating
    if (studentId && studentId.toUpperCase() !== student.studentId) {
      const exists = await Student.findOne({ studentId: studentId.toUpperCase() });
      if (exists) return res.status(400).json({ message: "Student ID already exists." });
      student.studentId = studentId.toUpperCase();
    }

    if (name !== undefined) student.name = name;
    if (email !== undefined) student.email = email;
    if (phone !== undefined) student.phone = phone;
    if (address !== undefined) student.address = address;
    if (profilePhotoUrl !== undefined) student.profilePhotoUrl = profilePhotoUrl;

    // SAFE room conversion
    const oldRoomId = student.room || null;
    let newRoomId = null;
    if (typeof room === "string" && room.trim() !== "") newRoomId = room.trim().toUpperCase();

    // Remove student from old room (if changing)
    if (oldRoomId && oldRoomId !== newRoomId) {
      const old = await Room.findOne({ roomId: oldRoomId });
      if (old) {
        old.occupants = old.occupants.filter(oid => String(oid) !== String(student._id));
        await old.save();
      }
    }

    // Add to new room (if provided)
    if (newRoomId) {
      const r = await Room.findOne({ roomId: newRoomId });
      if (!r) return res.status(400).json({ message: "Room not found." });

      if (r.occupants.length >= r.capacity) return res.status(400).json({ message: "Room is full." });

      if (!r.occupants.includes(student._id)) r.occupants.push(student._id);
      await r.save();
      student.room = newRoomId;
    } else {
      student.room = null;
    }

    await student.save();
    res.json(student);
  } catch (err) {
    console.error("Admin update student error:", err);
    res.status(500).json({ message: "Error updating student." });
  }
});

/* DELETE student */
router.delete("/:id", async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found." });

    if (student.room) {
      const rm = await Room.findOne({ roomId: student.room });
      if (rm) {
        rm.occupants = rm.occupants.filter(oid => String(oid) !== String(student._id));
        await rm.save();
      }
    }

    await User.deleteOne({ studentProfile: student._id });
    await student.deleteOne();

    res.json({ message: "Student deleted." });
  } catch (err) {
    console.error("Delete student error:", err);
    res.status(500).json({ message: "Error deleting student." });
  }
});

module.exports = router;
