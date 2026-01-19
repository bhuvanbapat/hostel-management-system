const express = require("express");
const Room = require("../models/room.model");
const Student = require("../models/student.model");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET all rooms (students can view, admin can manage)
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find()
      .sort({ roomId: 1 })
      .populate("occupants")
      .lean({ virtuals: true });

    res.json(rooms);
  } catch (err) {
    console.error("Error fetching rooms:", err);
    res.status(500).json({ message: "Error fetching rooms." });
  }
});

// ADMIN ONLY BELOW
router.use(isAdmin);

// CREATE room
router.post("/", async (req, res) => {
  try {
    let { roomId, capacity } = req.body;

    // normalize and validate
    roomId = (roomId || "").toString().trim();
    if (!roomId || capacity === undefined || capacity === null || capacity === "") {
      return res.status(400).json({ message: "roomId and capacity required." });
    }

    const capNum = Number(capacity);
    if (!Number.isFinite(capNum) || capNum <= 0) {
      return res.status(400).json({ message: "Capacity must be a positive number." });
    }

    const rid = roomId.toUpperCase();

    const exists = await Room.findOne({ roomId: rid });
    if (exists) {
      return res.status(400).json({ message: "Room already exists." });
    }

    const room = await Room.create({
      roomId: rid,
      capacity: capNum,
      occupants: [],
      imageUrl: req.body.imageUrl || "",
      description: req.body.description || "",
    });

    // return with virtuals
    const fresh = await Room.findById(room._id).lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    console.error("Error creating room:", err);
    res.status(500).json({ message: "Error creating room." });
  }
});

// UPDATE room
router.put("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    const { roomId, capacity, imageUrl, description } = req.body;

    if (roomId !== undefined) {
      const rid = roomId.toString().trim().toUpperCase();
      if (rid !== room.roomId) {
        const exists = await Room.findOne({ roomId: rid });
        if (exists) {
          return res.status(400).json({ message: "Room ID already exists." });
        }
        // Update student room references
        await Student.updateMany({ room: room.roomId }, { $set: { room: rid } });
        room.roomId = rid;
      }
    }

    if (capacity !== undefined) {
      const capNum = Number(capacity);
      if (!Number.isFinite(capNum) || capNum <= 0) {
        return res.status(400).json({ message: "Capacity must be a positive number." });
      }
      if (capNum < room.occupants.length) {
        return res.status(400).json({ message: "Capacity cannot be less than current occupants." });
      }
      room.capacity = capNum;
    }

    if (imageUrl !== undefined) room.imageUrl = imageUrl;
    if (description !== undefined) room.description = description;

    await room.save();

    const fresh = await Room.findById(room._id).populate("occupants").lean({ virtuals: true });
    res.json(fresh);
  } catch (err) {
    console.error("Error updating room:", err);
    res.status(500).json({ message: "Error updating room." });
  }
});

// DELETE room
router.delete("/:id", async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found." });

    // deallocate students that reference this roomId
    await Student.updateMany({ room: room.roomId }, { $set: { room: null } });

    await room.deleteOne();
    res.json({ message: "Room deleted." });
  } catch (err) {
    console.error("Error deleting room:", err);
    res.status(500).json({ message: "Error deleting room." });
  }
});

module.exports = router;
