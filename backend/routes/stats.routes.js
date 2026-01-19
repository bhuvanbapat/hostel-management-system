const express = require("express");
const Student = require("../models/student.model");
const Room = require("../models/room.model");
const Complaint = require("../models/complaint.model");
const Fee = require("../models/fee.model");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);
router.use(isAdmin);

router.get("/", async (req, res) => {
  try {
    const [totalStudents, rooms, pendingComplaints, pendingFees] =
      await Promise.all([
        Student.countDocuments(),
        Room.find(),
        Complaint.countDocuments({ status: "open" }),
        Fee.countDocuments({ status: "pending" }),
      ]);

    const totalRooms = rooms.length;
    const occupiedRooms = rooms.filter((r) => r.occupants && r.occupants.length > 0).length;
    const availableRooms = rooms.filter((r) => r.status === "available").length;

    res.json({
      totalStudents,
      totalRooms,
      occupiedRooms,
      availableRooms,
      pendingComplaints,
      pendingFees,
    });
  } catch (err) {
    console.error("Error fetching stats:", err);
    res.status(500).json({ message: "Error fetching stats." });
  }
});

module.exports = router;
