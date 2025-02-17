const express = require("express");
const authController = require("../controllers/auth.controller");

const router = express.Router();

//otp routes
router.post("/send-otp", authController.sendOTP);
router.post("/verify-otp",authController.verifyOTPAndRegister);

// Login Route
router.post("/login", authController.login);

// Logout Route
router.post("/logout", authController.authMiddleware, authController.logout);

// Validate Session Route
router.get("/validate-session", authController.validateSession);

// Protected Route Example
router.get("/protected", authController.authMiddleware, authController.protectedRoute);

module.exports = router;
