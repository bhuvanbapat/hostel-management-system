const express = require("express");
const Announcement = require("../models/announcement.model");
const Notification = require("../models/notification.model");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// GET /api/announcements  — public to both roles
router.get("/", async (req, res) => {
  try {
    const list = await Announcement.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    console.error("Error fetching announcements:", err);
    res.status(500).json({ message: "Error fetching announcements." });
  }
});

// POST /api/announcements  — only admin
router.post("/", isAdmin, async (req, res) => {
  try {
    const { title, message, text } = req.body;

    // Support both new format (title + message) and legacy format (text)
    const announcementTitle = title || text || "Announcement";
    const announcementMessage = message || text || "";

    if (!announcementTitle || !announcementTitle.trim()) {
      return res.status(400).json({ message: "Title required." });
    }

    const ann = await Announcement.create({
      title: announcementTitle,
      message: announcementMessage,
      text: announcementMessage, // backward compatibility
    });

    // 🔔 Notify all students
    await Notification.create({
      role: "student",
      title: "New Announcement",
      message: announcementTitle,
      type: "announcement",
    });

    res.json(ann);
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ message: "Error creating announcement." });
  }
});

// DELETE /api/announcements/:id — only admin
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const ann = await Announcement.findByIdAndDelete(req.params.id);
    if (!ann) {
      return res.status(404).json({ message: "Announcement not found." });
    }
    res.json({ message: "Announcement deleted." });
  } catch (err) {
    console.error("Error deleting announcement:", err);
    res.status(500).json({ message: "Error deleting announcement." });
  }
});

module.exports = router;
