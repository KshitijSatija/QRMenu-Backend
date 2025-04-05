const axios = require("axios");
require("dotenv").config();

const backendUrl = process.env.BACKEND_URL || "https://qrmenu-backend-zu98.onrender.com"; // Replace with actual Render backend URL

const keepAlive = () => {
  setInterval(async () => {
    try {
      await axios.get(`${backendUrl}/ping`); // Ping the backend every 5 minutes
      console.log("Keep-alive ping sent to backend.");
    } catch (error) {
      console.error("Keep-alive ping failed:", error.message);
    }
  }, 300000); // 5 minutes (300,000 ms)
};

module.exports = keepAlive;
