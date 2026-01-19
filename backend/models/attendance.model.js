const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    type: { type: String, enum: ["checkin", "checkout"], required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
