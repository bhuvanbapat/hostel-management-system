const express = require("express");
const Fee = require("../models/fee.model");
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

// ======================================
// STUDENT: VIEW OWN FEES
// GET /api/fees/my
// ======================================
router.get("/my", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;

    if (!studentId) {
      return res.status(400).json({ message: "Student profile not linked." });
    }

    // Find student by studentId to get the ObjectId
    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // CRITICAL FIX: Query fees by BOTH student ObjectId AND studentId string
    // This ensures we catch all fees regardless of how they were created
    const fees = await Fee.find({
      $or: [
        { student: student._id },
        { studentId: studentId.toUpperCase() }
      ]
    }).sort({ dueDate: 1 });

    // Ensure all returned fees have the correct student reference (async fix in background)
    // This fixes any orphaned fees without blocking the response
    fees.forEach(fee => {
      if (!fee.student || String(fee.student) !== String(student._id)) {
        fee.student = student._id;
        if (!fee.studentId) {
          fee.studentId = student.studentId;
        }
        fee.save().catch(err => console.error("Error updating fee reference:", err));
      }
    });

    res.json(fees);
  } catch (err) {
    console.error("Error fetching my fees:", err);
    res.status(500).json({ message: "Error fetching fees." });
  }
});

// ======================================
// ADMIN ONLY BELOW
// ======================================
router.use(isAdmin);

// GET /api/fees
router.get("/", async (req, res) => {
  try {
    const list = await Fee.find()
      .populate("student")
      .sort({ dueDate: 1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching fees:", err);
    res.status(500).json({ message: "Error fetching fees." });
  }
});

// POST /api/fees  (manual add)
router.post("/", async (req, res) => {
  try {
    const { studentId, month, amount, dueDate, status } = req.body;

    const student = await Student.findOne({
      studentId: studentId.toUpperCase(),
    });

    if (!student) {
      return res.status(400).json({ message: "Student not found." });
    }

    const fee = await Fee.create({
      student: student._id,
      studentId: student.studentId,
      month,
      amount,
      dueDate: dueDate ? new Date(dueDate) : null,
      status: status || "pending",
    });

    // Notify student
    const user = await User.findOne({ studentProfile: student._id });
    if (user) {
      await Notification.create({
        user: user._id,
        role: "student",
        title: "New Fee Entry",
        message: `New fee added for ${month}: ₹${amount} (${fee.status}).`,
        type: "fee",
      });
    }

    res.json(fee);
  } catch (err) {
    console.error("Error creating fee:", err);
    res.status(500).json({ message: "Error creating fee." });
  }
});

// ======================================
// GENERATE MONTHLY FEES
// POST /api/fees/generate
// ======================================
router.post("/generate", async (req, res) => {
  try {
    const now = new Date();
    const monthString = now.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    }); // e.g., "Nov 2025"

    const defaultAmount = 5000;

    const students = await Student.find();

    if (!students.length) {
      return res.json({ message: "No students available." });
    }

    let createdCount = 0;

    for (const student of students) {
      const alreadyExists = await Fee.findOne({
        studentId: student.studentId,
        month: monthString,
      });

      if (alreadyExists) continue;

      await Fee.create({
        student: student._id,
        studentId: student.studentId,
        month: monthString,
        amount: defaultAmount,
        dueDate: now,
        status: "pending",
      });

      // Notify student
      const user = await User.findOne({ studentProfile: student._id });
      if (user) {
        await Notification.create({
          user: user._id,
          role: "student",
          title: "Monthly Fees Generated",
          message: `Your hostel fee for ${monthString}: ₹${defaultAmount} is pending.`,
          type: "fee",
        });
      }

      createdCount++;
    }

    res.json({
      message: `Monthly fees generated for ${createdCount} students.`,
      month: monthString,
      created: createdCount,
    });
  } catch (err) {
    console.error("Generate Fees Error:", err);
    res.status(500).json({ message: "Error generating monthly fees." });
  }
});

// ======================================
// FIX 1: TOGGLE STATUS (Added this missing route)
// PUT /api/fees/:id/toggle-status
// ======================================
router.put("/:id/toggle-status", async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found." });

    fee.status = fee.status === "paid" ? "pending" : "paid";
    await fee.save();

    // Notify student about status change
    if (fee.student) {
      const student = await Student.findById(fee.student);
      if (student) {
        const user = await User.findOne({ studentProfile: student._id });
        if (user) {
          await Notification.create({
            user: user._id,
            role: "student",
            title: "Fee Status Updated",
            message: `Your fee for ${fee.month} is now marked as ${fee.status}.`,
            type: "fee",
          });
        }
      }
    }

    res.json(fee);
  } catch (err) {
    console.error("Toggle Fee Error:", err);
    res.status(500).json({ message: "Error toggling fee." });
  }
});

// ======================================
// UPDATE FEE
// ======================================
router.put("/:id", async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found." });

    const { month, amount, dueDate, status } = req.body;

    if (month !== undefined) fee.month = month;
    if (amount !== undefined) fee.amount = amount;
    if (dueDate !== undefined)
      fee.dueDate = dueDate ? new Date(dueDate) : null;
    if (status !== undefined) fee.status = status;

    await fee.save();

    // ===============================================
    // FIX 2: Safe Student Lookup (Prevents Crash)
    // ===============================================
    let student = null;
    if (fee.studentId) {
      student = await Student.findOne({
        studentId: fee.studentId.toUpperCase(),
      });
    }

    if (student) {
      const user = await User.findOne({ studentProfile: student._id });
      if (user) {
        await Notification.create({
          user: user._id,
          role: "student",
          title: "Fee Updated",
          message: `Your fee for ${fee.month} is now ${fee.status}.`,
          type: "fee",
        });
      }
    }

    res.json(fee);
  } catch (err) {
    console.error("Error updating fee:", err);
    res.status(500).json({ message: "Error updating fee." });
  }
});

// ======================================
// DELETE
// ======================================
router.delete("/:id", async (req, res) => {
  try {
    const fee = await Fee.findByIdAndDelete(req.params.id);
    if (!fee) return res.status(404).json({ message: "Fee not found." });

    res.json({ message: "Fee deleted." });
  } catch (err) {
    console.error("Error deleting fee:", err);
    res.status(500).json({ message: "Error deleting fee." });
  }
});

module.exports = router;