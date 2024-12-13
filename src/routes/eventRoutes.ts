import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { authenticateToken } from "../middleware/authenticateToken";
import { Event } from "../models/Event";
import { DataStore } from "../utils/DataStore";

const router = express.Router();

const eventsStore = DataStore.getInstance<Event>("events");

// Get All Events
router.get(
  "/",
  authenticateToken,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const events = eventsStore.getAll();
      res.json(events);
    } catch (error) {
      next(error);
    }
  }
);

// Create Event
router.post(
  "/",
  authenticateToken,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { title, description, date } = req.body;

      if (!title || !description || !date) {
        res.status(400).json({ error: "All fields are required" });
        return;
      }

      const newEvent = new Event(
        title,
        description,
        date,
        res.locals.user.username
      );

      const storedEvent = eventsStore.create(newEvent);

      res.status(201).json({ message: "Event created", event: storedEvent });
    } catch (error) {
      next(error);
    }
  }
);

// Update Event
router.put(
  "/:id",
  authenticateToken,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const { title, description, date } = req.body;

      const events = eventsStore.getAll();
      const event = events.find((e) => e.id === id);

      if (!event) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      if (event.organizer !== res.locals.user.username) {
        res.status(403).json({ error: "Not authorized to edit this event" });
        return;
      }

      const updatedEvent = eventsStore.update(id, { title, description, date });

      res.json({ message: "Event updated", updatedEvent });
    } catch (error) {
      next(error);
    }
  }
);

// Delete Event
router.delete(
  "/:id",
  authenticateToken,
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { id } = req.params;
      const events = eventsStore.getAll();

      const eventIndex = events.findIndex((e) => e.id === id);
      if (eventIndex === -1) {
        res.status(404).json({ error: "Event not found" });
        return;
      }

      // Ensure the user is the organizer of the event
      if (events[eventIndex].organizer !== res.locals.user.username) {
        res.status(403).json({ error: "Not authorized to delete this event" });
        return;
      }

      // Remove the event from the array
      eventsStore.delete(id);

      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
