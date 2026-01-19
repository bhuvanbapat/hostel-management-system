const express = require("express");
const Attendance = require("../models/attendance.model");
const { authMiddleware, isStudent } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(isStudent);

// Helper: Get start and end of today
function getTodayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ---------------------------------
// GET student own logs
// ---------------------------------
router.get("/me", async (req, res) => {
  try {
    const logs = await Attendance.find({
      studentId: req.user.studentId
    }).sort({ createdAt: -1 }).limit(50);

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: "Error loading attendance." });
  }
});

// ---------------------------------
// GET today's attendance status
// ---------------------------------
router.get("/today", async (req, res) => {
  try {
    if (!req.user || !req.user.studentId) {
      return res.status(400).json({ message: "Student profile not linked properly." });
    }

    const { start, end } = getTodayRange();

    const todayLogs = await Attendance.find({
      studentId: req.user.studentId,
      createdAt: { $gte: start, $lte: end }
    }).sort({ createdAt: -1 });

    const checkedIn = todayLogs.some(log => log.type === "checkin");
    const checkedOut = todayLogs.some(log => log.type === "checkout");

    res.json({
      checkedIn,
      checkedOut,
      canCheckIn: !checkedIn,
      canCheckOut: checkedIn && !checkedOut,
      todayLogs
    });
  } catch (err) {
    console.error("Attendance Today Error:", err);
    res.status(500).json({ message: "Error fetching today's status." });
  }
});

// ---------------------------------
// POST check-in (ONE PER DAY)
// ---------------------------------
router.post("/checkin", async (req, res) => {
  try {
    if (!req.user || !req.user.studentId) {
      return res.status(400).json({ message: "Student profile missing. Cannot check in." });
    }

    const { start, end } = getTodayRange();

    // Check if already checked in today
    const existingCheckin = await Attendance.findOne({
      studentId: req.user.studentId,
      type: "checkin",
      createdAt: { $gte: start, $lte: end }
    });

    if (existingCheckin) {
      return res.status(400).json({
        message: "Already checked in today.",
        checkinTime: existingCheckin.createdAt
      });
    }

    const entry = new Attendance({
      studentId: req.user.studentId,
      type: "checkin"
    });

    await entry.save();

    res.json({
      message: "Checked in successfully",
      checkinTime: entry.createdAt
    });
  } catch (err) {
    console.error("Checkin Error:", err);
    res.status(500).json({ message: "Error performing check-in" });
  }
});

// ---------------------------------
// POST check-out (ONE PER DAY, AFTER CHECK-IN)
// ---------------------------------
router.post("/checkout", async (req, res) => {
  try {
    const { start, end } = getTodayRange();

    // Check if checked in today
    const todayCheckin = await Attendance.findOne({
      studentId: req.user.studentId,
      type: "checkin",
      createdAt: { $gte: start, $lte: end }
    });

    if (!todayCheckin) {
      return res.status(400).json({
        message: "Must check in before checking out."
      });
    }

    // Check if already checked out today
    const existingCheckout = await Attendance.findOne({
      studentId: req.user.studentId,
      type: "checkout",
      createdAt: { $gte: start, $lte: end }
    });

    if (existingCheckout) {
      return res.status(400).json({
        message: "Already checked out today.",
        checkoutTime: existingCheckout.createdAt
      });
    }

    const entry = new Attendance({
      studentId: req.user.studentId,
      type: "checkout"
    });

    await entry.save();

    res.json({
      message: "Checked out successfully",
      checkoutTime: entry.createdAt
    });
  } catch (err) {
    res.status(500).json({ message: "Error performing check-out" });
  }
});

module.exports = router;
