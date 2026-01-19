// ==============================================
// seedStudents.js — create 10 fresh student logins
// ==============================================

const mongoose = require("mongoose");
const User = require("./models/user.model");
const Student = require("./models/student.model");

require("dotenv").config();

// ⚠️ Use the SAME URI as in server.js
const dbURI = process.env.MONGODB_URI;

// ---------- helpers ----------
function generatePassword(length = 10) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!";
  let pwd = "";
  for (let i = 0; i < length; i++) {
    pwd += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pwd;
}

// 10 Indian-style names for STU001..STU010
const seedStudents = [
  { studentId: "STU001", name: "Arjun Kumar" },
  { studentId: "STU002", name: "Ravi Sharma" },
  { studentId: "STU003", name: "Aditi Singh" },
  { studentId: "STU004", name: "Neha Reddy" },
  { studentId: "STU005", name: "Karan Verma" },
  { studentId: "STU006", name: "Priya Nair" },
  { studentId: "STU007", name: "Sandeep Joshi" },
  { studentId: "STU008", name: "Sneha Patil" },
  { studentId: "STU009", name: "Rohit Mehta" },
  { studentId: "STU010", name: "Kavya Iyer" },
];

async function run() {
  try {
    console.log("⏳ Connecting to MongoDB...");
    await mongoose.connect(dbURI);
    console.log("✅ Connected.");

    // Optional: wipe old students completely
    console.log("🧹 Deleting existing student users + profiles...");
    await User.deleteMany({ role: "student" });
    await Student.deleteMany({});
    console.log("✅ Old students wiped.");

    const created = [];

    for (const s of seedStudents) {
      const sid = s.studentId.toUpperCase();
      const name = s.name;

      const plainPassword = generatePassword(10); // real password shown to you

      // 1) create Student document
      const studentDoc = new Student({
        studentId: sid,
        name,
        // room: null by default (Rooms: NO)
      });
      await studentDoc.save();

      // 2) create User document linked to student
      const userDoc = new User({
        username: sid.toLowerCase(), // stu001, stu002, ...
        password: plainPassword,     // will be hashed by pre('save')
        plainPassword: plainPassword, // stored as-is so you can see it
        role: "student",
        studentProfile: studentDoc._id,
      });
      await userDoc.save();

      created.push({
        studentId: sid,
        name,
        username: userDoc.username,
        password: plainPassword,
      });
    }

    console.log("\n🎉 DONE! Created the following student accounts:\n");
    created.forEach((c) => {
      console.log(
        `Student: ${c.name} (${c.studentId})  |  Username: ${c.username}  |  Password: ${c.password}`
      );
    });

    console.log("\n🔑 Save these credentials somewhere safe.");
  } catch (err) {
    console.error("❌ Error in seeding students:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected.");
    process.exit(0);
  }
}

run();
