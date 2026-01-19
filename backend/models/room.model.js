const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
    },
    occupants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
    imageUrl: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

// VIRTUAL: computedStatus (empty / partial / full)
roomSchema.virtual("computedStatus").get(function () {
  const occ = Array.isArray(this.occupants) ? this.occupants.length : 0;
  const cap = typeof this.capacity === "number" ? this.capacity : 0;

  if (occ === 0) return "empty";
  if (occ < cap) return "partial";
  return "full";
});

// Ensure virtuals are included when returning objects
roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Room", roomSchema);
