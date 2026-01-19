const jwt = require("jsonwebtoken");

// JWT Secret loaded from environment variable (defined in .env file)
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-key-change-in-production";

function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"] || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "No token provided." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token." });
  }
}

function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access required." });
  }
  next();
}

function isStudent(req, res, next) {
  if (!req.user || req.user.role !== "student") {
    return res.status(403).json({ message: "Student access required." });
  }
  next();
}

module.exports = {
  authMiddleware,
  isAdmin,
  isStudent,
  JWT_SECRET,
};
