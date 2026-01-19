const mongoose = require("mongoose");
const User = require("../models/user.model");
const Student = require("../models/student.model");

const dbURI =
  "mongodb+srv://hms_user:HmsProject2024@cluster0.hw9rlka.mongodb.net/hms?retryWrites=true&w=majority&appName=Cluster0";

async function run() {
  await mongoose.connect(dbURI);
  console.log("Connected.");

  const students = await Student.find();
  for (const s of students) {
    let user = await User.findOne({ username: s.studentId.toLowerCase() });

    if (!user) {
      user = new User({
        username: s.studentId.toLowerCase(),
        password: s.studentId + "@123",
        role: "student",
        studentProfile: s._id,
      });
      await user.save();
      console.log(`Created user for ${s.studentId}`);
    } else {
      if (!user.studentProfile) {
        user.studentProfile = s._id;
        await user.save();
        console.log(`Linked existing user ${user.username} to ${s.studentId}`);
      }
    }
  }

  await mongoose.disconnect();
  console.log("Done.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
