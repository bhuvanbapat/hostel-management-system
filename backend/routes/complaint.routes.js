const express = require("express");
const Complaint = require("../models/complaint.model");
const Student = require("../models/student.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const { authMiddleware, isAdmin, isStudent } = require("../middleware/authMiddleware");

const router = express.Router();
router.use(authMiddleware);

// Student submits a complaint (ensure field name is 'issue')
router.post("/", isStudent, async (req, res) => {
  try {
    const { issue } = req.body;
    if (!issue || !issue.trim()) {
      return res.status(400).json({ message: "Complaint field cannot be empty." });
    }

    const studentId = req.user.studentId;
    if (!studentId) return res.status(400).json({ message: "Your account is not linked to a student profile." });

    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) return res.status(404).json({ message: "Student details missing. Contact admin." });

    const complaint = await Complaint.create({
      studentId: student.studentId,
      issue: issue.trim(),
      status: "pending",
    });

    // Notify admins
    await Notification.create({
      role: "admin",
      title: "New Complaint",
      message: `${student.name} (${student.studentId}) submitted a complaint.`,
      type: "complaint",
    });

    return res.json({ message: "Complaint submitted.", complaint });
  } catch (err) {
    console.error("CREATE COMPLAINT ERROR:", err);
    res.status(500).json({ message: "Server error submitting complaint.", error: err.message });
  }
});

// Student gets own complaints
router.get("/my", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const complaints = await Complaint.find({ studentId: studentId.toUpperCase() }).sort({ createdAt: -1 });
    return res.json(complaints);
  } catch (err) {
    console.error("GET /my complaints error:", err);
    res.status(500).json({ message: "Error loading your complaints." });
  }
});

// Admin routes below
router.use(isAdmin);

router.get("/", async (req, res) => {
  const list = await Complaint.find().sort({ createdAt: -1 });
  res.json(list);
});

router.put("/:id/resolve", async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Not found." });

    complaint.status = "resolved";
    await complaint.save();

    // notify student
    const student = await Student.findOne({ studentId: complaint.studentId.toUpperCase() });
    if (student) {
      const user = await User.findOne({ studentProfile: student._id });
      if (user) {
        await Notification.create({
          user: user._id,
          role: "student",
          title: "Complaint Resolved",
          message: `Your complaint "${complaint.issue}" has been resolved.`,
          type: "complaint",
        });
      }
    }

    res.json(complaint);
  } catch (err) {
    console.error("Resolve complaint error:", err);
    res.status(500).json({ message: "Error resolving complaint." });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) return res.status(404).json({ message: "Not found." });
    res.json({ message: "Complaint deleted." });
  } catch (err) {
    console.error("Delete complaint error:", err);
    res.status(500).json({ message: "Error deleting complaint." });
  }
});

module.exports = router;
