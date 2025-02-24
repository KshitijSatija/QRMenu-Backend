const User = require("../models/user.model");

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
