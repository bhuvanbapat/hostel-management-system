// ===========================================
//  server.js — UPDATED WITH Notifications
// ===========================================

// Load environment variables from .env file
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// MODELS
const User = require("./models/user.model");
const Setting = require("./models/setting.model");

// ROUTES
const leaveRoutes = require("./routes/leave.routes");
const authRoutes = require("./routes/auth.routes");
const studentRoutes = require("./routes/student.routes");
const roomRoutes = require("./routes/room.routes");
const complaintRoutes = require("./routes/complaint.routes");
const feeRoutes = require("./routes/fee.routes");
const announcementRoutes = require("./routes/announcement.routes");
const messMenuRoutes = require("./routes/messmenu.routes");
const statsRoutes = require("./routes/stats.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const profileRoutes = require("./routes/profile.routes");
const notificationRoutes = require("./routes/notification.routes");
const roomRequestRoutes = require("./routes/roomRequest.routes");

const app = express();
app.use(express.json());
app.use(cors());

// serve uploaded profile photos
app.use("/uploads", express.static("uploads"));

const PORT = process.env.PORT || 3000;

// ------------------------
// MONGO CONNECTION
// ------------------------
// MongoDB URI loaded from environment variable (defined in .env file)
const dbURI = process.env.MONGODB_URI;

mongoose
  .connect(dbURI)
  .then(() => console.log("✅ Successfully connected to MongoDB Atlas!"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// ------------------------
// CREATE DEFAULT ADMIN
// ------------------------
async function ensureDefaultAdmin() {
  // Admin credentials loaded from environment variables (defined in .env file)
  const adminUsername = process.env.ADMIN_USERNAME || "admin";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  let admin = await User.findOne({ username: adminUsername.toLowerCase() });

  if (!admin) {
    admin = new User({
      username: adminUsername.toLowerCase(),
      password: adminPassword,       // will be hashed by schema
      plainPassword: adminPassword,  // stored as visible password
      role: "admin",
    });

    await admin.save();
    console.log(`✅ Default admin created: ${adminUsername}/${adminPassword}`);
  } else {
    console.log(`ℹ️ Admin already exists: ${admin.username}`);
  }
}

// ------------------------
// ROUTES
// ------------------------
app.use("/api/leaves", leaveRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/fees", feeRoutes);
app.use("/api/announcements", announcementRoutes);
app.use("/api/settings", messMenuRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/room-requests", roomRequestRoutes);

app.get("/", (req, res) => {
  res.json({ message: "HMS Backend Running" });
});

// ------------------------
// SERVER START
// ------------------------
mongoose.connection.once("open", async () => {
  await ensureDefaultAdmin();
  await Setting.initializeMessMenu();

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
});
