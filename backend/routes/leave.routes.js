const express = require("express");
const Leave = require("../models/leave.model");
const Student = require("../models/student.model");
const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const {
  authMiddleware,
  isAdmin,
  isStudent,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// =====================================================
// STUDENT: APPLY LEAVE
// POST /api/leaves
// =====================================================
router.post("/", isStudent, async (req, res) => {
  try {
    const { category, fromDate, toDate, reason, documentUrl } = req.body;

    if (!category || !fromDate || !toDate || !reason) {
      return res
        .status(400)
        .json({ message: "Category, dates and reason are required." });
    }

    const tokenStudentId = req.user.studentId;
    if (!tokenStudentId) {
      return res
        .status(400)
        .json({ message: "Your account is not linked to a student profile." });
    }

    const student = await Student.findOne({
      studentId: tokenStudentId.toUpperCase(),
    });

    if (!student) {
      return res.status(404).json({
        message:
          "Student record not found. Contact admin to link student profile.",
      });
    }

    const leave = await Leave.create({
      student: student._id,
      studentId: student.studentId,
      category,
      fromDate: new Date(fromDate),
      toDate: new Date(toDate),
      reason,
      documentUrl: documentUrl || "",
      status: "pending",
    });

    // 🔔 Notify admins: new leave request
    await Notification.create({
      role: "admin",
      title: "New Leave Request",
      message: `${student.name} (${student.studentId}) requested leave.`,
      type: "leave",
    });

    return res.json({ message: "Leave request submitted.", leave });
  } catch (err) {
    console.error("🐞 CREATE LEAVE ERROR:", err);
    return res.status(500).json({
      message: "Server error creating leave request.",
      error: err.message,
    });
  }
});

// =====================================================
// STUDENT: VIEW OWN LEAVES
// GET /api/leaves/my
// =====================================================
router.get("/my", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(400).json({ message: "Student profile not linked." });
    }

    const leaves = await Leave.find({
      studentId: studentId.toUpperCase(),
    }).sort({ createdAt: -1 });

    return res.json(leaves);
  } catch (err) {
    console.error("🐞 FETCH MY LEAVES ERROR:", err);
    return res.status(500).json({ message: "Error fetching leave list." });
  }
});

// =====================================================
// ADMIN ROUTES
// =====================================================
router.use(isAdmin);

// GET /api/leaves
router.get("/", async (req, res) => {
  try {
    const leaves = await Leave.find().populate("student").sort({ createdAt: -1 });
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ message: "Error loading leaves." });
  }
});

// PUT /api/leaves/:id/approve
router.put("/:id/approve", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found." });

    leave.status = "approved";
    leave.adminRemark = req.body.adminRemark || "";
    await leave.save();

    // 🔔 Notify student
    const user = await User.findOne({ studentProfile: leave.student });
    if (user) {
      await Notification.create({
        user: user._id,
        role: "student",
        title: "Leave Approved",
        message: `Your leave from ${leave.fromDate.toDateString()} to ${leave.toDate.toDateString()} is approved.`,
        type: "leave",
      });
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: "Error approving leave." });
  }
});

// PUT /api/leaves/:id/reject
router.put("/:id/reject", async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found." });

    leave.status = "rejected";
    leave.adminRemark = req.body.adminRemark || "";
    await leave.save();

    // 🔔 Notify student
    const user = await User.findOne({ studentProfile: leave.student });
    if (user) {
      await Notification.create({
        user: user._id,
        role: "student",
        title: "Leave Rejected",
        message: `Your leave from ${leave.fromDate.toDateString()} to ${leave.toDate.toDateString()} is rejected.`,
        type: "leave",
      });
    }

    res.json(leave);
  } catch (err) {
    res.status(500).json({ message: "Error rejecting leave." });
  }
});

// DELETE /api/leaves/:id
router.delete("/:id", async (req, res) => {
  try {
    const leave = await Leave.findByIdAndDelete(req.params.id);
    if (!leave) return res.status(404).json({ message: "Leave not found." });

    res.json({ message: "Leave deleted." });
  } catch (err) {
    res.status(500).json({ message: "Error deleting leave." });
  }
});

module.exports = router;
