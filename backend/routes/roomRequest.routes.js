const express = require("express");
const RoomRequest = require("../models/roomRequest.model");
const Student = require("../models/student.model");
const Room = require("../models/room.model");
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
// STUDENT: VIEW OWN ROOM REQUESTS
// GET /api/room-requests/my
// ======================================
router.get("/my", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(400).json({ message: "Student profile not linked." });
    }

    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    const requests = await RoomRequest.find({ student: student._id })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Error fetching room requests:", err);
    res.status(500).json({ message: "Error fetching room requests." });
  }
});

// ======================================
// STUDENT: CREATE ROOM REQUEST
// POST /api/room-requests
// ======================================
router.post("/", isStudent, async (req, res) => {
  try {
    const studentId = req.user.studentId;
    if (!studentId) {
      return res.status(400).json({ message: "Student profile not linked." });
    }

    const { requestedRoomId, reason } = req.body;
    if (!requestedRoomId) {
      return res.status(400).json({ message: "Room ID is required." });
    }

    const student = await Student.findOne({ studentId: studentId.toUpperCase() });
    if (!student) {
      return res.status(404).json({ message: "Student not found." });
    }

    // Check if room exists
    const room = await Room.findOne({ roomId: requestedRoomId.toUpperCase() });
    if (!room) {
      return res.status(400).json({ message: "Room not found." });
    }

    // Check if student already has a pending request for this room
    const existingRequest = await RoomRequest.findOne({
      student: student._id,
      requestedRoomId: requestedRoomId.toUpperCase(),
      status: "pending",
    });

    if (existingRequest) {
      return res.status(400).json({ message: "You already have a pending request for this room." });
    }

    // Check if student already has this room
    if (student.room === requestedRoomId.toUpperCase()) {
      return res.status(400).json({ message: "You are already assigned to this room." });
    }

    const request = await RoomRequest.create({
      student: student._id,
      studentId: student.studentId,
      requestedRoomId: requestedRoomId.toUpperCase(),
      reason: reason || "",
      status: "pending",
    });

    res.json(request);
  } catch (err) {
    console.error("Error creating room request:", err);
    res.status(500).json({ message: "Error creating room request." });
  }
});

// ======================================
// ADMIN ONLY BELOW
// ======================================
router.use(isAdmin);

// GET all room requests
router.get("/", async (req, res) => {
  try {
    const requests = await RoomRequest.find()
      .populate("student")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Error fetching room requests:", err);
    res.status(500).json({ message: "Error fetching room requests." });
  }
});

// APPROVE/REJECT room request
router.put("/:id/status", async (req, res) => {
  try {
    const { status, adminRemark } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status." });
    }

    const request = await RoomRequest.findById(req.params.id).populate("student");
    if (!request) {
      return res.status(404).json({ message: "Request not found." });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed." });
    }

    request.status = status;
    request.adminRemark = adminRemark || "";

    // If approved, assign room to student
    if (status === "approved") {
      const student = request.student;
      const room = await Room.findOne({ roomId: request.requestedRoomId });

      if (!room) {
        return res.status(400).json({ message: "Room not found." });
      }

      if (room.occupants.length >= room.capacity) {
        return res.status(400).json({ message: "Room is full." });
      }

      // Remove student from old room if any
      if (student.room) {
        const oldRoom = await Room.findOne({ roomId: student.room });
        if (oldRoom) {
          oldRoom.occupants = oldRoom.occupants.filter(
            (oid) => String(oid) !== String(student._id)
          );
          await oldRoom.save();
        }
      }

      // Add to new room
      if (!room.occupants.includes(student._id)) {
        room.occupants.push(student._id);
      }
      await room.save();

      student.room = request.requestedRoomId;
      await student.save();
    }

    await request.save();

    // Notify student
    const user = await User.findOne({ studentProfile: request.student._id });
    if (user) {
      await Notification.create({
        user: user._id,
        role: "student",
        title: `Room Request ${status === "approved" ? "Approved" : "Rejected"}`,
        message: `Your room request for ${request.requestedRoomId} has been ${status}.${adminRemark ? ` Admin remark: ${adminRemark}` : ""}`,
        type: "room",
      });
    }

    res.json(request);
  } catch (err) {
    console.error("Error updating room request:", err);
    res.status(500).json({ message: "Error updating room request." });
  }
});

// DELETE room request
router.delete("/:id", async (req, res) => {
  try {
    await RoomRequest.findByIdAndDelete(req.params.id);
    res.json({ message: "Request deleted." });
  } catch (err) {
    console.error("Error deleting room request:", err);
    res.status(500).json({ message: "Error deleting request." });
  }
});

module.exports = router;

