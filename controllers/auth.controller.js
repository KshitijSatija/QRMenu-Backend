const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const User = require("../models/user.model");
const Session = require("../models/session.model");
const LoginAttempt = require("../models/LoginAttempt.model");
const { sendLoginConfirmation, sendRegistrationConfirmation,sendOTPEmail } = require('../utils/emailService');
const OTPVerification = require('../models/OTPVerification.model');

// Step 1: Generate OTP and send it to the user
exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // Generate a 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Store OTP in the database (overwrite if exists)
    await OTPVerification.findOneAndUpdate(
      { email },
      { otp, expiry },
      { upsert: true, new: true }
    );

    // Send OTP to the user's email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP sent to email. Please verify to complete registration." });
  } catch (err) {
    console.error("Error sending OTP:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

exports.verifyOTPAndRegister = async (req, res) => {
  try {
    const { email, otp, username, password, firstName, lastName, mobileno, dob } = req.body;

    // Validate input
    if (!email || !otp || !username || !password || !firstName || !lastName || !mobileno || !dob) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Find OTP record
    const otpRecord = await OTPVerification.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Check if OTP has expired
    if (otpRecord.expiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // OTP is valid, so proceed with user registration
    const hashedPassword = await bcrypt.hash(password, process.env.SALT);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      mobileno,
      dob,
      role: "user",  // Default role
    });

    // Save the user in the database
    await newUser.save();

    // Send registration confirmation email
    await sendRegistrationConfirmation(newUser.email, newUser.username, newUser.firstName);

    // Remove OTP record after successful registration
    await OTPVerification.deleteOne({ email });

    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Error during OTP verification:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, mobileno, dob } = req.body;

    // Validate input
    if (!username || !email || !password || !firstName || !lastName || !mobileno || !dob) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }, { mobileno }] });
    if (existingUser) {
      return res.status(400).json({ message: "Username, email, or mobile number already taken." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, process.env.SALT);

    // Create a new user with the provided data
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      firstName,
      lastName,
      mobileno,
      dob,
      role: "user", // Default role
    });

    // Save the user in the database
    await newUser.save();
    await sendRegistrationConfirmation(newUser.email, newUser.username,newUser.firstName);
    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};


const MAX_ATTEMPTS = 5; //Max failed attempts before blocking
const BLOCK_TIME = 30 * 60 * 1000; //Block for 30 minutes 

exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login attempt:", { username, password });

  try {
    const user = await User.findOne({ username });
    const userIP = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || req.connection?.remoteAddress || "IP Not Found";

    const nowUtc = new Date();
    const nowIst = new Date(nowUtc.getTime() + (5.5 * 60 * 60 * 1000)); 
    const attemptTime = nowIst; 

    const failedAttempts = await LoginAttempt.countDocuments({
      ipAddress: userIP,
      success: false,
      timestamp: { $gte: new Date(Date.now() - BLOCK_TIME) },
    });

    if (failedAttempts >= MAX_ATTEMPTS) {
      return res.status(429).json({ message: "Too many failed attempts. Try again later." });
    }

    const loginAttempt = {
      ipAddress: userIP,
      username,
      success: false,  
      timestamp: attemptTime,
    };

    await LoginAttempt.create(loginAttempt);

    if (!user) {
      console.log("User not found:", username);
      return res.status(401).json({ message: "Invalid username or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log("Invalid password for user:", username);
      await LoginAttempt.findOneAndUpdate({ username, ipAddress: userIP, timestamp: attemptTime }, { success: false });
      return res.status(401).json({ message: "Invalid username or password" });
    }

    await LoginAttempt.findOneAndUpdate({ username, ipAddress: userIP, timestamp: attemptTime }, { success: true });

    const sessionHash = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(nowIst.getTime() + 24 * 60 * 60 * 1000); // Add 1 day

    const session = new Session({ userId: user._id, sessionHash, expiresAt, ipAddress: userIP });
    await session.save();

    console.log("Session created for user:", username, "Session Hash:", sessionHash, "IP Address:", userIP);
    await sendLoginConfirmation(user.email, user.username, user.firstName);

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


