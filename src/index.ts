import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Logger from "./utils/Logger";
import authRoutes from "./routes/authRoutes";
import eventRoutes from "./routes/eventRoutes";
import { errorHandler } from "./middleware/errorHandler";

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

// Error handler
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  Logger.ready(`Server is running on http://localhost:${PORT}`);
});
