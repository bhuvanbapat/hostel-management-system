// backend/routes/messmenu.routes.js

const express = require("express");
const Setting = require("../models/setting.model");
const { authMiddleware, isAdmin } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

// ------------------------------------------------------------
// GET WEEKLY MESS MENU  (admin + student)
// FINAL FIXED ROUTE: /api/settings/messMenu
// ------------------------------------------------------------
router.get("/messMenu", async (req, res) => {
  try {
    const s = await Setting.findOne({ key: "messMenu" });
    const menu = s ? s.value : null;
    res.json(menu || { week: {} });
  } catch (err) {
    res.status(500).json({ message: "Error fetching mess menu" });
  }
});

// ------------------------------------------------------------
// UPDATE WEEKLY MESS MENU  (admin only)
// FINAL FIXED ROUTE: /api/settings/messMenu
// ------------------------------------------------------------
router.put("/messMenu", isAdmin, async (req, res) => {
  try {
    const menu = req.body;

    if (!menu || !menu.week) {
      return res.status(400).json({ message: "Invalid menu format." });
    }

    const updated = await Setting.findOneAndUpdate(
      { key: "messMenu" },
      { value: menu },
      { new: true, upsert: true }
    );

    res.json(updated.value);
  } catch (err) {
    console.error("Error updating mess menu:", err);
    res.status(500).json({ message: "Error updating mess menu." });
  }
});

module.exports = router;
