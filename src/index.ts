import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import Logger from "./utils/Logger";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  Logger.log(`${req.method} ${req.path}`);

  next();
});

// Routes
app.use("/auth", authRoutes);
app.use("/events", eventRoutes);

// Create data folder and files
const dataDir = join(__dirname, "data");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir);
  writeFileSync(join(dataDir, "users.json"), "[]");
  writeFileSync(join(dataDir, "events.json"), "[]");
}

// Start server
app.listen(PORT, () => {
  Logger.ready(`Server is running on http://localhost:${PORT}`);
});
