const express = require("express");
const router = express.Router();
const menuController = require("../controllers/menu.controller");
const validateSession = require("../middleware/auth.middleware");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() }); // Store files in memory as buffers

// Create Menu (Authenticated users only)
router.post(
  "/",
  validateSession,
  upload.fields([{ name: "logo" }, { name: "backgroundImage" }]),
  menuController.createMenu
);

// Get the authenticated user's menu (Private)
router.get("/my-menu", validateSession, menuController.getMyMenu);

router.get("/logs", validateSession, menuController.getMenuLogs);

router.get("/logs/recent", validateSession, menuController.getRecentLogs);

// Update Menu (Authenticated users only)
router.put(
  "/:menuId",
  validateSession,
  upload.fields([{ name: "logo" }, { name: "backgroundImage" }]),
  menuController.updateMenu
);

// Delete Menu (Authenticated users only)
router.delete("/:menuId", validateSession, menuController.deleteMenu);

// Get Public Menu by Restaurant Name (Open to everyone)
router.get("/:restaurantName", menuController.getMenuByRestaurant);

module.exports = router;