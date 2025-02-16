const bcrypt = require("bcryptjs");
const User = require("../models/user.model"); // Import the User model

// Register a new user
exports.register = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already taken." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user with a default role
    const newUser = new User({
      username,
      password: hashedPassword,
      role: "user", // Default role
    });

    // Save the user in the database
    await newUser.save();

    res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    console.error("Error during registration:", err);
    res.status(500).json({ message: "Server error. Please try again later." });
  }
};
