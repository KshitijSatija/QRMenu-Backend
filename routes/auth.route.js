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


//change password
router.post("/change-password", authController.authMiddleware, authController.changePassword);

//deactive/delete route

//router.post("/delete-account", authController.authMiddleware, authController.deleteAccount);

router.post("/delete-otp", authController.authMiddleware, authController.sendDeleteOTP);

router.post("/verify-delete-otp", authController.verifyOTPAndDelete);

module.exports = router;
