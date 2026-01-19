const express = require('express');
const jwt = require('jsonwebtoken');
const Student = require('../models/student.model');
const Room = require('../models/room.model');
const Fee = require('../models/fee.model');
const Complaint = require('../models/complaint.model');

// Import JWT_SECRET from shared middleware (now uses environment variable)
const { JWT_SECRET } = require('../middleware/authMiddleware');

const router = express.Router();

function auth(req, res, next) {
    const header = req.headers['authorization'] || '';
    const [type, token] = header.split(' ');
    if (type !== 'Bearer' || !token) {
        return res.status(401).json({ message: 'No token provided.' });
    }
    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Invalid token.' });
        req.user = decoded.user;
        next();
    });
}


// GET /api/stats
router.get('/stats', auth, async (req, res) => {
    try {
        const [
            totalStudents,
            totalRooms,
            availableRooms,
            pendingComplaints,
            pendingFees
        ] = await Promise.all([
            Student.countDocuments(),
            Room.countDocuments(),
            Room.countDocuments({ status: 'available' }),
            Complaint.countDocuments({ status: 'pending' }),
            Fee.countDocuments({ status: 'pending' })
        ]);

        const occupiedRooms = totalRooms - availableRooms;

        res.json({
            totalStudents,
            totalRooms,
            availableRooms,
            occupiedRooms,
            pendingComplaints,
            pendingFees
        });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching stats', error: err.message });
    }
});

module.exports = router;
