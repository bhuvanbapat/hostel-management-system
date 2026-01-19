const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    // REMOVED: profilePhotoUrl - all profile photos managed via Student model by admin

    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }, // hashed password
    plainPassword: { type: String, required: true }, // REAL PASSWORD STORED
    role: { type: String, enum: ["admin", "student"], required: true },
    studentProfile: { type: mongoose.Schema.Types.ObjectId, ref: "Student", default: null }
  },
  { timestamps: true }
);

// Hash password if modified
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
