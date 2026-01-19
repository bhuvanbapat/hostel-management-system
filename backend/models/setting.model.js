const mongoose = require("mongoose");

const settingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { timestamps: true }
);

settingSchema.statics.initializeMessMenu = async function () {
  const Setting = this;
  const existing = await Setting.findOne({ key: "messMenu" });
  if (existing) {
    console.log("ℹ️ Mess menu setting already exists.");
    return;
  }

  const defaultMenu = {
    week: {
      Monday: { breakfast: "", lunch: "", dinner: "" },
      Tuesday: { breakfast: "", lunch: "", dinner: "" },
      Wednesday: { breakfast: "", lunch: "", dinner: "" },
      Thursday: { breakfast: "", lunch: "", dinner: "" },
      Friday: { breakfast: "", lunch: "", dinner: "" },
      Saturday: { breakfast: "", lunch: "", dinner: "" },
      Sunday: { breakfast: "", lunch: "", dinner: "" },
    },
  };

  await Setting.create({ key: "messMenu", value: defaultMenu });
  console.log("✅ Default mess menu initialized.");
};

module.exports = mongoose.model("Setting", settingSchema);
