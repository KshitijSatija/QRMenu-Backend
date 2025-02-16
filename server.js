require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth.route");
const user = require("./routes/user.route");
const validateSession= require("./middleware/auth.middleware");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(validateSession);
// Routes
app.use("/auth", authRoutes);
app.use("/user", user);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
