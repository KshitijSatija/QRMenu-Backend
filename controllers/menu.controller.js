const Menu = require("../models/menu.model");
const Session = require("../models/session.model");
const MenuLog = require("../models/menuLogs.model");
// Helper: Verify session and return userId
const verifySession = async (req) => {
  const sessionHash = req.headers.authorization?.split(" ")[1];
  if (!sessionHash) throw new Error("Missing session hash");

  const session = await Session.findOne({ sessionHash }).populate("userId");
  if (!session || new Date() > session.expiresAt) throw new Error("Invalid or expired session");

  return session.userId;
};


// Get public menu by restaurant name
exports.getMenuByRestaurant = async (req, res) => {
  try {
    const { restaurantName } = req.params;
    const menu = await Menu.findOne({ restaurantName });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found." });
    }

    const menuData = menu.toObject();
    if (menuData.logo && menuData.logo.data) {
      menuData.logo.data = menuData.logo.data.toString("base64");
    }
    if (menuData.backgroundImage && menuData.backgroundImage.data) {
      menuData.backgroundImage.data = menuData.backgroundImage.data.toString("base64");
    }

    res.status(200).json(menuData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu.", error: error.message });
  }
};

exports.createMenu = async (req, res) => {
  try {
    const user = await verifySession(req);

    const existingMenu = await Menu.findOne({ restaurantId: user._id });
    if (existingMenu) {
      return res.status(400).json({ message: "Menu already exists for this restaurant." });
    }

    const { sections, displayMode, backgroundType, backgroundValue, socialLinks, displayName } = req.body;

    const newMenu = new Menu({
      restaurantId: user._id,
      sections: sections ? (typeof sections === "string" ? JSON.parse(sections) : sections) : [],
      displayMode: displayMode || "stacked",
      backgroundType: backgroundType || "color",
      backgroundValue: backgroundValue || "#ffffff",
      socialLinks: socialLinks ? (typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks) : [],
      displayName: displayName || user.username,
    });

    if (req.files?.logo) {
      newMenu.logo = {
        data: req.files["logo"][0].buffer,
        contentType: req.files["logo"][0].mimetype,
      };
    }

    if (req.files?.backgroundImage && backgroundType === "image") {
      newMenu.backgroundImage = {
        data: req.files["backgroundImage"][0].buffer,
        contentType: req.files["backgroundImage"][0].mimetype,
      };
    }

    await newMenu.save();

    await MenuLog.create({
      userId: user._id,
      action: "create",
      targetType: "Menu",
      targetId: newMenu._id,
      ipAddress: req.ip,
    });

    res.status(201).json({ message: "Menu created successfully.", menu: newMenu });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ message: "Error creating menu.", error: error.message });
  }
};
exports.updateMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const { menuId } = req.params;

    const menu = await Menu.findOne({ _id: menuId, restaurantId: user._id });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found or unauthorized." });
    }

    const oldData = menu.toObject();
    const updates = req.body;

    const changes = {};

    // Section
    if (updates.sections) {
      const newVal = typeof updates.sections === "string" ? JSON.parse(updates.sections) : updates.sections;
      if (JSON.stringify(newVal) !== JSON.stringify(oldData.sections)) {
        menu.sections = newVal;
        changes.sections = { before: oldData.sections, after: newVal };
      }
    }

    // Display mode
    if (updates.displayMode && updates.displayMode !== oldData.displayMode) {
      menu.displayMode = updates.displayMode;
      changes.displayMode = { before: oldData.displayMode, after: updates.displayMode };
    }

    // Background type
    if (updates.backgroundType && updates.backgroundType !== oldData.backgroundType) {
      menu.backgroundType = updates.backgroundType;
      changes.backgroundType = { before: oldData.backgroundType, after: updates.backgroundType };
    }

    // Background value
    if (updates.backgroundValue && updates.backgroundValue !== oldData.backgroundValue) {
      menu.backgroundValue = updates.backgroundValue;
      changes.backgroundValue = { before: oldData.backgroundValue, after: updates.backgroundValue };
    }

    // Social links
    if (updates.socialLinks) {
      const newVal = typeof updates.socialLinks === "string" ? JSON.parse(updates.socialLinks) : updates.socialLinks;
      if (JSON.stringify(newVal) !== JSON.stringify(oldData.socialLinks)) {
        menu.socialLinks = newVal;
        changes.socialLinks = { before: oldData.socialLinks, after: newVal };
      }
    }

    // Display name
    if (updates.displayName !== undefined && updates.displayName !== oldData.displayName) {
      menu.displayName = updates.displayName;
      changes.displayName = { before: oldData.displayName, after: updates.displayName };
    }

    // Logo
    if (req.files?.logo) {
      const newLogoFile = req.files.logo[0];
      const oldLogoBuffer = menu.logo?.data;
      const oldLogoContentType = menu.logo?.contentType;

      const newLogoBase64 = `data:${newLogoFile.mimetype};base64,${newLogoFile.buffer.toString("base64")}`;
      const oldLogoBase64 = oldLogoBuffer
        ? `data:${oldLogoContentType};base64,${oldLogoBuffer.toString("base64")}`
        : null;

      menu.logo = {
        data: newLogoFile.buffer,
        contentType: newLogoFile.mimetype,
      };

      changes.logo = {
        before: oldLogoBase64,
        after: newLogoBase64,
      };
    }

    // Background image
    if (req.files?.backgroundImage && (updates.backgroundType === "image" || menu.backgroundType === "image")) {
      const newBgFile = req.files.backgroundImage[0];
      const oldBgBuffer = menu.backgroundImage?.data;
      const oldBgContentType = menu.backgroundImage?.contentType;

      const newBgBase64 = `data:${newBgFile.mimetype};base64,${newBgFile.buffer.toString("base64")}`;
      const oldBgBase64 = oldBgBuffer
        ? `data:${oldBgContentType};base64,${oldBgBuffer.toString("base64")}`
        : null;

      menu.backgroundImage = {
        data: newBgFile.buffer,
        contentType: newBgFile.mimetype,
      };

      changes.backgroundImage = {
        before: oldBgBase64,
        after: newBgBase64,
      };
    }

    await menu.save();

    // Log only if there were changes
    if (Object.keys(changes).length > 0) {
      await MenuLog.create({
        userId: user._id,
        action: "update",
        targetType: "Menu",
        targetId: menu._id,
        details: changes,
        ipAddress: req.ip,
      });
    }

    res.status(200).json({ message: "Menu updated successfully.", menu });
  } catch (error) {
    res.status(500).json({ message: "Error updating menu.", error: error.message });
  }
};


// GET /api/menu/logs/recent
exports.getRecentLogs = async (req, res) => {
  try {
    const userId = req.user._id; // assuming auth middleware sets req.user
    const logs = await MenuLog.find({ userId }) // <- FIXED: userId, not user
      .sort({ timestamp: -1 })
      .limit(4);

    res.json({ logs });
  } catch (error) {
    console.error("Failed to fetch recent logs:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


exports.deleteMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const { menuId } = req.params;

    const menu = await Menu.findOneAndDelete({ _id: menuId, restaurantId: user._id });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found or unauthorized." });
    }

    await MenuLog.create({
      userId: user._id,
      action: "delete",
      targetType: "Menu",
      targetId: menu._id,
      ipAddress: req.ip,
    });

    res.status(200).json({ message: "Menu deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu.", error: error.message });
  }
};

// Fetch logs for current user (optionally filter by menuId)
exports.getMenuLogs = async (req, res) => {
  try {
    const user = await verifySession(req);
    const { menuId } = req.query;

    const query = { userId: user._id };
    if (menuId) {
      query.targetId = menuId;
    }

    const logs = await MenuLog.find(query)
      .sort({ timestamp: -1 }) // newest first
      .select("-__v") // remove mongoose versioning
      .lean();

    res.status(200).json({ logs });
  } catch (error) {
    res.status(500).json({ message: "Error fetching logs", error: error.message });
  }
};









// test old
/*
// Create a new menu
exports.createMenu = async (req, res) => {
  try {
    const user = await verifySession(req);

    const existingMenu = await Menu.findOne({ restaurantId: user._id });
    if (existingMenu) {
      return res.status(400).json({ message: "Menu already exists for this restaurant." });
    }

    const { sections, displayMode, backgroundType, backgroundValue, socialLinks, displayName } = req.body;

    const newMenu = new Menu({
      restaurantId: user._id,
      sections: sections ? (typeof sections === "string" ? JSON.parse(sections) : sections) : [],
      displayMode: displayMode || "stacked",
      backgroundType: backgroundType || "color",
      backgroundValue: backgroundValue || "#ffffff",
      socialLinks: socialLinks ? (typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks) : [],
      displayName: displayName || user.username, // Use provided displayName or default to username
    });

    if (req.files && req.files["logo"]) {
      newMenu.logo = {
        data: req.files["logo"][0].buffer,
        contentType: req.files["logo"][0].mimetype,
      };
    }
    if (req.files && req.files["backgroundImage"] && backgroundType === "image") {
      newMenu.backgroundImage = {
        data: req.files["backgroundImage"][0].buffer,
        contentType: req.files["backgroundImage"][0].mimetype,
      };
    }

    await newMenu.save();
    res.status(201).json({ message: "Menu created successfully.", menu: newMenu });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ message: "Error creating menu.", error: error.message });
  }
};

// Update menu
exports.updateMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const { menuId } = req.params;

    const menu = await Menu.findOne({ _id: menuId, restaurantId: user._id });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found or unauthorized." });
    }

    const { sections, displayMode, backgroundType, backgroundValue, socialLinks, displayName } = req.body;

    menu.sections = sections ? (typeof sections === "string" ? JSON.parse(sections) : sections) : menu.sections;
    menu.displayMode = displayMode || menu.displayMode;
    menu.backgroundType = backgroundType || menu.backgroundType;
    menu.backgroundValue = backgroundValue || menu.backgroundValue;
    menu.socialLinks = socialLinks ? (typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks) : menu.socialLinks;
    menu.displayName = displayName !== undefined ? displayName : menu.displayName; // Update if provided

    if (req.files && req.files["logo"]) {
      menu.logo = {
        data: req.files["logo"][0].buffer,
        contentType: req.files["logo"][0].mimetype,
      };
    }
    if (req.files && req.files["backgroundImage"] && backgroundType === "image") {
      menu.backgroundImage = {
        data: req.files["backgroundImage"][0].buffer,
        contentType: req.files["backgroundImage"][0].mimetype,
      };
    }

    await menu.save();
    res.status(200).json({ message: "Menu updated successfully.", menu });
  } catch (error) {
    res.status(500).json({ message: "Error updating menu.", error: error.message });
  }
};


// Delete menu
exports.deleteMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const { menuId } = req.params;

    const menu = await Menu.findOneAndDelete({ _id: menuId, restaurantId: user._id });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found or unauthorized." });
    }

    res.status(200).json({ message: "Menu deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting menu.", error: error.message });
  }
};
*/
// Get menu for the authenticated user
exports.getMyMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const menu = await Menu.findOne({ restaurantId: user._id });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found." });
    }

    const menuData = menu.toObject();
    if (menuData.logo && menuData.logo.data) {
      menuData.logo.data = menuData.logo.data.toString("base64");
    }
    if (menuData.backgroundImage && menuData.backgroundImage.data) {
      menuData.backgroundImage.data = menuData.backgroundImage.data.toString("base64");
    }

    res.status(200).json(menuData);
  } catch (error) {
    res.status(500).json({ message: "Error fetching menu.", error: error.message });
  }
};





// old stuff


/*
// Update menu
exports.updateMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const { menuId } = req.params;

    const menu = await Menu.findOne({ _id: menuId, restaurantId: user._id });
    if (!menu) {
      return res.status(404).json({ message: "Menu not found or unauthorized." });
    }

    

    const { sections, displayMode, backgroundType, backgroundValue, socialLinks } = req.body;

    // Parse JSON strings if necessary
    menu.sections = sections ? (typeof sections === "string" ? JSON.parse(sections) : sections) : menu.sections;
    menu.displayMode = displayMode || menu.displayMode;
    menu.backgroundType = backgroundType || menu.backgroundType;
    menu.backgroundValue = backgroundValue || menu.backgroundValue;
    menu.socialLinks = socialLinks ? (typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks) : menu.socialLinks;

    if (req.files && req.files["logo"]) {
      menu.logo = {
        data: req.files["logo"][0].buffer,
        contentType: req.files["logo"][0].mimetype,
      };
    }
    if (req.files && req.files["backgroundImage"] && backgroundType === "image") {
      menu.backgroundImage = {
        data: req.files["backgroundImage"][0].buffer,
        contentType: req.files["backgroundImage"][0].mimetype,
      };
    }

    await menu.save();
    res.status(200).json({ message: "Menu updated successfully.", menu });
  } catch (error) {
    
    res.status(500).json({ message: "Error updating menu.", error: error.message });
  }
};
*/

/*
// Get menu for the authenticated user
exports.getMyMenu = async (req, res) => {
  try {
    const user = await verifySession(req);
    const menu = await Menu.findOne({ restaurantId: user._id });

    if (!menu) {
      return res.status(404).json({ message: "Menu not found." });
    }

    const menuData = menu.toObject();
    if (menuData.logo && menuData.logo.data) {
      menuData.logo.data = menuData.logo.data.toString("base64");
    }
    if (menuData.backgroundImage && menuData.backgroundImage.data) {
      menuData.backgroundImage.data = menuData.backgroundImage.data.toString("base64");
    }

    res.status(200).json(menuData);
  } catch (error) {
    
    res.status(500).json({ message: "Error fetching menu.", error: error.message });
  }
};
*/


/*
// Create a new menu
exports.createMenu = async (req, res) => {
  try {
    const user = await verifySession(req);

    const existingMenu = await Menu.findOne({ restaurantId: user._id });
    if (existingMenu) {
      return res.status(400).json({ message: "Menu already exists for this restaurant." });
    }

    

    const { sections, displayMode, backgroundType, backgroundValue, socialLinks } = req.body;

    const newMenu = new Menu({
      restaurantId: user._id,
      sections: sections ? (typeof sections === "string" ? JSON.parse(sections) : sections) : [],
      displayMode: displayMode || "stacked",
      backgroundType: backgroundType || "color",
      backgroundValue: backgroundValue || "#ffffff",
      socialLinks: socialLinks ? (typeof socialLinks === "string" ? JSON.parse(socialLinks) : socialLinks) : [],
    });

    if (req.files && req.files["logo"]) {
      newMenu.logo = {
        data: req.files["logo"][0].buffer,
        contentType: req.files["logo"][0].mimetype,
      };
    }
    if (req.files && req.files["backgroundImage"] && backgroundType === "image") {
      newMenu.backgroundImage = {
        data: req.files["backgroundImage"][0].buffer,
        contentType: req.files["backgroundImage"][0].mimetype,
      };
    }

    await newMenu.save();
    res.status(201).json({ message: "Menu created successfully.", menu: newMenu });
  } catch (error) {
    console.error("Error creating menu:", error);
    res.status(500).json({ message: "Error creating menu.", error: error.message });
  }
};
*/