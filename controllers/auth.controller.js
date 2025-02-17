const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user.model");
const Session = require("../models/session.model");
const LoginAttempt = require("../models/LoginAttempt.model"); // Assuming you've created this model
const MAX_ATTEMPTS = 5; // Max failed attempts before blocking
const BLOCK_TIME = 30 * 60 * 1000; // Block for 30 minutes (in milliseconds)

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username, password });

  try {
    const user = await User.findOne({ username });
    const userIP = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || req.connection?.remoteAddress || "IP Not Found";

    // Convert current time to IST
    const nowUtc = new Date();
    const nowIst = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000)); // Convert UTC to IST
    const attemptTime = nowIst; // Record the login attempt time in IST

    // Check failed login attempts in the last BLOCK_TIME (30 minutes)
    const failedAttempts = await LoginAttempt.countDocuments({
      ipAddress: userIP,
      success: false,
      timestamp: { $gte: new Date(Date.now() - BLOCK_TIME) },
    });

    // If the number of failed attempts exceeds MAX_ATTEMPTS, block login
    if (failedAttempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many failed attempts. Try again later." });
    }

    // Log the login attempt (success or failure)
    const loginAttempt = {
      ipAddress: userIP,
      username,
      success: false,  // Initially mark as failed, we'll change it after password check
      timestamp: attemptTime,
    };

    // Log the failed attempt for now (we'll change success flag after validation)
    await LoginAttempt.create(loginAttempt);

    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", username);
      // Update the login attempt to mark it as failed
      await LoginAttempt.findOneAndUpdate({ username, ipAddress: userIP, timestamp: attemptTime }, { success: false });
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // After successful login, update login attempt to mark it as successful
    await LoginAttempt.findOneAndUpdate({ username, ipAddress: userIP, timestamp: attemptTime }, { success: true });

    // Create a new session
    const sessionHash = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(nowIst.getTime() + 24 * 60 * 60 * 1000); // Add 1 day

    const session = new Session({ userId: user._id, sessionHash, expiresAt, ipAddress: userIP });
    await session.save();

    console.log("Session created for user:", username, "Session Hash:", sessionHash, "IP Address:", userIP);
    res.status(200).json({ sessionHash });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error", error });
  }
};



// Logout Controller
exports.logout = async (req, res) => {
  const sessionHash = req.headers["authorization"]?.split(" ")[1];
  console.log("Logging out session hash:", sessionHash);

  await Session.deleteOne({ sessionHash });
  res.status(200).json({ message: "Logged out successfully" });
};

// Validate Session Controller
exports.validateSession = async (req, res) => {
  const sessionHash = req.headers.authorization?.split("Bearer ")[1];

  if (!sessionHash) {
    return res.status(401).json({ message: "Session hash is required" });
  }

  try {
    const session = await Session.findOne({ sessionHash });

    if (!session || new Date(session.expiresAt) < new Date()) {
      return res.status(401).json({ message: "Session is invalid or expired" });
    }

    const user = await User.findById(session.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    res.status(200).json({ username: user.username });
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ message: "Server error", error });
  }
};

// Protected Route Example
exports.protectedRoute = async (req, res) => {
  res.status(200).json({ message: "You are authenticated!" });
};

// Middleware for checking session validity
exports.authMiddleware = async (req, res, next) => {
  const sessionHash = req.headers["authorization"]?.split(" ")[1];
  console.log("Authorization header received:", sessionHash);

  if (!sessionHash) {
    console.log("Authorization header missing or invalid");
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const session = await Session.findOne({ sessionHash });
    if (!session) {
      console.log("Session not found for session hash:", sessionHash);
      return res.status(401).json({ message: "Session not found" });
    }

    if (session.expiresAt < Date.now()) {
      console.log("Session expired:", sessionHash);
      await Session.deleteOne({ _id: session._id });
      return res.status(401).json({ message: "Session expired" });
    }

    req.userId = session.userId;
    console.log("Session is valid for user:", req.userId);
    next();
  } catch (error) {
    console.error("Error in session validation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
