const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const validateSession = require("../middleware/auth.middleware");

router.get("/profile", validateSession, userController.getUserProfile);

module.exports = router;
