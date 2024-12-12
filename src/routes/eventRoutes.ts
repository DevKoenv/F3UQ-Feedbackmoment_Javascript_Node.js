import express, { type Request, type Response } from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import { Event } from "../models/Event";
import { readJSON, writeJSON } from "../utils/fileUtils";
import path from "path";

const router = express.Router();
const EVENTS_FILE = path.join(__dirname, "..", "data", "users.json");

router.get("/", authenticateToken, (req: Request, res: Response): void => {
  const events = readJSON<Event>(EVENTS_FILE);
  res.json(events);
});

router.post("/", authenticateToken, (req: Request, res: Response): void => {
  const { title, description, date } = req.body;
  const user = res.locals.user;
  if (!title || !description || !date) {
    res.status(400).json({ error: "All fields are required" });
    return;
  }

  const events = readJSON<Event>(EVENTS_FILE);
  const newEvent = new Event(
    events.length + 1,
    title,
    description,
    date,
    user.username,
    new Date().toISOString(),
  );

  events.push(newEvent);
  writeJSON(EVENTS_FILE, events);

  res.status(201).json({ message: "Event created", event: newEvent });
});

export default router;
