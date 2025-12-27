const express = require("express");
const cors = require("cors");
const scanRoutes = require("./routes/scanRoutes");

const app = express();

console.log("=".repeat(60));
console.log("BACKEND INITIALIZATION STARTING");
console.log("=".repeat(60));

// Middleware
console.log("[SETUP] Configuring CORS middleware...");
app.use(cors());
console.log("[SETUP] ✓ CORS enabled");

console.log("[SETUP] Configuring JSON parser middleware...");
app.use(express.json());
console.log("[SETUP] ✓ JSON parser enabled");

// Health check endpoint
app.get("/health", (req, res) => {
  console.log("[HEALTH] Health check endpoint called");
  const healthStatus = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  console.log("[HEALTH] Status:", JSON.stringify(healthStatus, null, 2));
  res.json(healthStatus);
});

// Log all incoming requests
app.use((req, res, next) => {
  console.log("\n" + "=".repeat(60));
  console.log(`[REQUEST] ${new Date().toISOString()}`);
  console.log(`[REQUEST] Method: ${req.method}`);
  console.log(`[REQUEST] URL: ${req.url}`);
  console.log(`[REQUEST] Headers:`, JSON.stringify(req.headers, null, 2));
  console.log(`[REQUEST] Body:`, JSON.stringify(req.body, null, 2));
  console.log("=".repeat(60));
  next();
});

// Main API route
console.log("[SETUP] Mounting API routes at /api...");
app.use("/api", scanRoutes);
console.log("[SETUP] ✓ API routes mounted");

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("\n" + "!".repeat(60));
  console.error("[ERROR] Unhandled error in Express:");
  console.error("[ERROR] Message:", err.message);
  console.error("[ERROR] Stack:", err.stack);
  console.error("!".repeat(60));
  res.status(500).json({ 
    error: "Internal server error",
    message: err.message,
    timestamp: new Date().toISOString()
  });
});

// Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log("\n" + "=".repeat(60));
  console.log(`✓ Backend running on http://localhost:${PORT}`);
  console.log(`✓ Health check: http://localhost:${PORT}/health`);
  console.log(`✓ Scan endpoint: http://localhost:${PORT}/api/scan`);
  console.log("=".repeat(60) + "\n");
  console.log("Server ready to accept requests...\n");
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error("\n" + "!".repeat(60));
  console.error("[FATAL] Uncaught Exception:");
  console.error("[FATAL]", err);
  console.error("!".repeat(60));
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error("\n" + "!".repeat(60));
  console.error("[FATAL] Unhandled Rejection at:", promise);
  console.error("[FATAL] Reason:", reason);
  console.error("!".repeat(60));
});