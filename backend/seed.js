// ===========================================
//  seed.js — COMPLETE, CLEAN, FINAL VERSION
// ===========================================

const mongoose = require('mongoose');

// MODELS
const User = require('./models/user.model');
const Student = require('./models/student.model');
const Room = require('./models/room.model');
const Fee = require('./models/fee.model');
const Complaint = require('./models/complaint.model');
const Setting = require('./models/setting.model');

require("dotenv").config();

// ===========================================
// 🔥 IMPORTANT: USE SAME URI AS server.js
// ===========================================

const dbURI = process.env.MONGODB_URI;


// ===========================================
// HELPER: CREATE OR UPDATE USER
// ===========================================
async function upsertUser({ username, password, role, studentProfile = null }) {
    username = username.toLowerCase();
    let user = await User.findOne({ username });

    if (!user) {
        user = new User({
            username,
            password,
            role,
            studentProfile
        });
    } else {
        user.role = role;
        if (password) user.password = password; // Will be hashed by schema
        if (studentProfile) user.studentProfile = studentProfile;
    }

    await user.save();
    console.log(`👤 User Upserted: ${username} (${role})`);

    return user;
}


// ===========================================
// MAIN SEED FUNCTION
// ===========================================
async function seed() {
    try {
        await mongoose.connect(dbURI);
        console.log('🌱 Connected to MongoDB for Seeding');

        // ------------------------------------
        // ROOM
        // ------------------------------------
        let room = await Room.findOne({ roomId: 'A101' });

        if (!room) {
            room = new Room({
                roomId: 'A101',
                capacity: 2,
                status: 'available',
                occupants: []
            });
            await room.save();
            console.log('🏠 Created Room A101');
        }

        // ------------------------------------
        // STUDENT PROFILE
        // ------------------------------------
        let student = await Student.findOne({ studentId: 'STU001' });

        if (!student) {
            student = new Student({
                studentId: 'STU001',
                name: 'Test Student',
                room: room.roomId
            });
            await student.save();
            console.log('🎓 Created Student STU001');
        }

        // LINK STUDENT TO ROOM
        if (!room.occupants.includes(student._id)) {
            room.occupants.push(student._id);
            room.status = 'occupied';
            await room.save();
            console.log('🔗 Linked STU001 → A101');
        }

        // ------------------------------------
        // ADMIN USER
        // ------------------------------------
        await upsertUser({
            username: 'admin',
            password: 'admin123',
            role: 'admin'
        });

        // ------------------------------------
        // STUDENT LOGIN USER
        // ------------------------------------
        await upsertUser({
            username: 'stu001',
            password: 'student123',
            role: 'student',
            studentProfile: student._id
        });

        // ------------------------------------
        // FEE RECORD
        // ------------------------------------
        let fee = await Fee.findOne({
            student: student._id,
            month: 'April 2025'
        });

        if (!fee) {
            fee = new Fee({
                student: student._id,
                month: 'April 2025',
                amount: 5000,
                status: 'pending',
                dueDate: new Date('2025-04-10')
            });
            await fee.save();
            console.log('💰 Created Fee Record for STU001');
        }

        // ------------------------------------
        // COMPLAINT RECORD
        // ------------------------------------
        let complaint = await Complaint.findOne({
            student: student._id
        });

        if (!complaint) {
            complaint = new Complaint({
                student: student._id,
                studentId: student.studentId,
                issue: 'WiFi not working properly',
                status: 'pending'
            });
            await complaint.save();
            console.log('📢 Created Complaint for STU001');
        }

        // ------------------------------------
        // MESS MENU DEFAULT
        // ------------------------------------
        await Setting.initializeMessMenu();

        console.log('🌱 SEEDING COMPLETED SUCCESSFULLY');

        await mongoose.disconnect();
        process.exit(0);

    } catch (err) {
        console.error('❌ SEEDING ERROR:', err);
        process.exit(1);
    }
}

seed();
