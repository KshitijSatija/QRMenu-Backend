require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/auth.route");
const validateSession = require("./middleware/auth.middleware");
const keepAlive = require("./keepAlive");
const userRoutes=require("./routes/user.route");
const menuRoutes = require("./routes/menu.route");
const analyticsRoutes = require('./routes/analytics.route');
const contactRoutes= require("./routes/contact.route");

const app = express();

//middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(validateSession);

//routes
app.use("/auth", authRoutes);
app.use("/user",userRoutes);
app.use("/api/menu", menuRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/contact',contactRoutes);

//IP tracking
app.set("trust proxy", true);
//keep-alive ping
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

//mongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

//server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  keepAlive();
});
