const mongoose = require("mongoose");
const User = require("../models/user.model");
const Student = require("../models/student.model");

const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

const dbURI = process.env.MONGODB_URI;

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
