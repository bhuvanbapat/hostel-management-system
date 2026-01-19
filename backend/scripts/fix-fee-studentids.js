/**
 * Fee StudentId Migration Script
 * 
 * Fixes fee records missing the 'studentId' string field.
 * Run with: node scripts/fix-fee-studentids.js
 */

const mongoose = require('mongoose');
const Fee = require('../models/fee.model');
const Student = require('../models/student.model');

const path = require('path');
require("dotenv").config({ path: path.resolve(__dirname, '../.env') });

// MongoDB URI from env
const MONGO_URI = process.env.MONGODB_URI;

async function migrate() {
    console.log('🔧 Fee StudentId Migration Script\n');

    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        const allFees = await Fee.find({});
        console.log(`📊 Total fee records: ${allFees.length}`);

        const feesWithoutStudentId = allFees.filter(f => !f.studentId);
        console.log(`⚠️  Fees missing studentId: ${feesWithoutStudentId.length}\n`);

        if (feesWithoutStudentId.length === 0) {
            console.log('✅ All fees already have studentId. Nothing to fix!');
            await mongoose.disconnect();
            return;
        }

        let fixed = 0;
        for (const fee of feesWithoutStudentId) {
            if (fee.student) {
                const student = await Student.findById(fee.student);
                if (student && student.studentId) {
                    fee.studentId = student.studentId;
                    await fee.save();
                    console.log(`✅ Fixed: ${fee._id} -> ${student.studentId}`);
                    fixed++;
                }
            }
        }

        console.log(`\n📊 Fixed ${fixed} fee records`);
        await mongoose.disconnect();
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

migrate().then(() => process.exit(0));
