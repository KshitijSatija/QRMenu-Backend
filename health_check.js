const axios = require("axios");
const mongoose = require("mongoose");
const FormData = require("form-data");
require("dotenv").config();

const API_BASE = "http://localhost:5000"; // Update if deployed
const sessionHash = process.env.HEALTH_SESSION_HASH;

const healthLogSchema = new mongoose.Schema({
  runAt: { type: Date, default: Date.now },
  results: [
    {
      route: String,
      method: String,
      status: Number,
      responseTimeMs: Number,
      success: Boolean,
      error: String,
    },
  ],
});

const HealthLog = mongoose.model("HealthLog", healthLogSchema);

async function runHealthCheck() {
  await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/healthcheck", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const results = [];
  let createdMenuId = null;

  const testCases = [
    {
      route: "/user/profile",
      method: "get",
      auth: true,
    },
    {
      route: "/user/signin-logs",
      method: "get",
      auth: true,
    },
    {
      route: "/api/menu",
      method: "post",
      auth: true,
      formData: {
        sections: JSON.stringify([{ name: "Main", items: ["Pizza"] }]),
        displayMode: "stacked",
        backgroundType: "color",
        backgroundValue: "#ffffff",
        socialLinks: JSON.stringify([{ platform: "instagram", url: "https://insta.com/test" }]),
      },
    },
    {
      route: "/api/menu/my-menu",
      method: "get",
      auth: true,
    },
    {
      route: "/api/menu/TEST_RESTAURANT",
      method: "get",
    },
    {
      route: "/api/menu/:menuId",
      method: "put",
      auth: true,
      note: "Dynamic",
    },
  ];

  for (const test of testCases) {
    const dynamic = test.route.includes(":menuId");
    const url = dynamic && createdMenuId
      ? `${API_BASE}/api/menu/${createdMenuId}`
      : `${API_BASE}${test.route}`;

    const headers = {};
    if (test.auth) {
      headers["Authorization"] = `Bearer ${sessionHash}`;
    }

    let data = null;
    let config = { headers };

    if (test.formData) {
      const form = new FormData();
      for (const key in test.formData) {
        form.append(key, test.formData[key]);
      }
      config.headers = { ...config.headers, ...form.getHeaders() };
      data = form;
    }

    const start = Date.now();
    try {
      const res = await axios({
        method: test.method,
        url,
        data,
        ...config,
      });

      // Capture menu ID after creation
      if (test.route === "/api/menu" && res.data.menu?._id) {
        createdMenuId = res.data.menu._id;
      }

      results.push({
        route: test.route,
        method: test.method.toUpperCase(),
        status: res.status,
        responseTimeMs: Date.now() - start,
        success: true,
        error: null,
      });
    } catch (err) {
      results.push({
        route: test.route,
        method: test.method.toUpperCase(),
        status: err.response?.status || 500,
        responseTimeMs: Date.now() - start,
        success: false,
        error: err.response?.data?.message || err.message,
      });
    }
  }

  // ✅ Clean up: delete the created menu at the END
  if (createdMenuId) {
    const deleteUrl = `${API_BASE}/api/menu/${createdMenuId}`;
    try {
      const delStart = Date.now();
      const deleteRes = await axios.delete(deleteUrl, {
        headers: { Authorization: `Bearer ${sessionHash}` },
      });

      results.push({
        route: "/api/menu/:menuId (delete)",
        method: "DELETE",
        status: deleteRes.status,
        responseTimeMs: Date.now() - delStart,
        success: true,
        error: null,
      });
    } catch (err) {
      results.push({
        route: "/api/menu/:menuId (delete)",
        method: "DELETE",
        status: err.response?.status || 500,
        responseTimeMs: Date.now() - Date.now(),
        success: false,
        error: err.response?.data?.message || err.message,
      });
    }
  }

  // ✅ Save the log
  const log = new HealthLog({ results });
  await log.save();
  console.log("✅ Health check complete. Log ID:", log._id);

  await mongoose.disconnect();
}

runHealthCheck();
