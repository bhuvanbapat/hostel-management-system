// backend/models/student.model.js

const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    // Email (optional)
    email: {
      type: String,
      default: "",
    },
    // NEW: contact details
    phone: {
      type: String,
      default: "",
    },
    address: {
      type: String,
      default: "",
    },
    // NEW: profile photo URL (served from /uploads)
    profilePhotoUrl: {
      type: String,
      default: "",
    },
    // existing room info
    room: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Student", studentSchema);
