const express = require("express");
const Notification = require("../models/notification.model");
const {
  authMiddleware,
  isAdmin,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// =======================================
// GET /api/notifications/my
// Current user's notifications
// =======================================
router.get("/my", async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const query = {
      $or: [
        { user: userId },              // personal notifications
        { user: null, role: role },    // role-wide notifications
      ],
    };

    const list = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(list);
  } catch (err) {
    console.error("Error fetching my notifications:", err);
    res.status(500).json({ message: "Error fetching notifications." });
  }
});

// =======================================
// GET /api/notifications/unread-count
// Get count of unread notifications
// =======================================
router.get("/unread-count", async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const query = {
      read: { $ne: true },
      $or: [
        { user: userId },
        { user: null, role: role },
      ],
    };

    const count = await Notification.countDocuments(query);

    res.json({ unreadCount: count });
  } catch (err) {
    console.error("Error counting unread notifications:", err);
    res.status(500).json({ message: "Error counting notifications." });
  }
});

// =======================================
// PUT /api/notifications/mark-all-read
// Mark all user's notifications as read
// =======================================
router.put("/mark-all-read", async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let query;

    // Admin can mark all notifications as read
    if (role === "admin") {
      query = { read: { $ne: true } };
    } else {
      // Students can only mark their own notifications
      query = {
        read: { $ne: true },
        $or: [
          { user: userId },
          { user: null, role: role },
        ],
      };
    }

    const result = await Notification.updateMany(query, { read: true });

    res.json({
      message: "All notifications marked as read.",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("Error marking all notifications read:", err);
    res.status(500).json({ message: "Error updating notifications." });
  }
});

// =======================================
// GET /api/notifications
// Admin: view all notifications
// =======================================
router.get("/", isAdmin, async (req, res) => {
  try {
    const list = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(100);
    res.json(list);
  } catch (err) {
    console.error("Error fetching all notifications:", err);
    res.status(500).json({ message: "Error fetching notifications." });
  }
});

// =======================================
// DELETE /api/notifications/:id
// Admin: delete a notification
// =======================================
router.delete("/:id", isAdmin, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) {
      return res.status(404).json({ message: "Notification not found." });
    }
    res.json({ message: "Notification deleted." });
  } catch (err) {
    console.error("Error deleting notification:", err);
    res.status(500).json({ message: "Error deleting notification." });
  }
});

// =======================================
// PUT /api/notifications/:id/read
// Mark as read (if belongs to user/role)
// =======================================
router.put("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) {
      return res.status(404).json({ message: "Notification not found." });
    }

    const role = req.user.role;
    const userId = req.user.id;

    // Basic guard: user must match or share role
    if (
      notif.user &&
      String(notif.user) !== String(userId) &&
      notif.role !== role
    ) {
      return res.status(403).json({ message: "Not allowed." });
    }

    notif.read = true;
    await notif.save();

    res.json({ message: "Notification marked as read.", notification: notif });
  } catch (err) {
    console.error("Error marking notification read:", err);
    res.status(500).json({ message: "Error updating notification." });
  }
});

module.exports = router;
