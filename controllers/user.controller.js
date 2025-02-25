const User = require("../models/user.model");
const Session = require("../models/session.model");
const LoginAttempt = require("../models/LoginAttempt.model");

exports.getUserProfile = async (req, res) => {
  try {
    const user = req.user; // Retrieved from validateSession middleware

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      mobileno: user.mobileno,
      dob: user.dob,
      role: user.role,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getSignInLogs = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const sessionHash = authHeader.split(" ")[1];
    if (!sessionHash) {
      return res.status(401).json({ message: "Session not found" });
    }

    // Find the session in the database
    const session = await Session.findOne({ sessionHash }).populate("userId");
    if (!session) {
      return res.status(401).json({ message: "Invalid session" });
    }

    // Get the username
    const username = session.userId.username;
    if (!username) {
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch successful login attempts, sorted in descending order
    const successfulLogins = await LoginAttempt.find({ 
      username, 
      success: true 
    })
    .select("ipAddress timestamp")
    .sort({ timestamp: -1 }); // Sort by latest first

    return res.json({ logins: successfulLogins });
  } catch (error) {
    console.error("Error fetching sign-in logs:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
