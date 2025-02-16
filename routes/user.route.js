const express = require("express");
const userController = require("../controllers/user.controller");

const router = express.Router();

// Register route
router.post("/register", userController.register);

module.exports = router;
