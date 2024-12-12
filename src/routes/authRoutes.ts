import { type Request, type Response, Router } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { readJSON, writeJSON } from "../utils/fileUtils";
import Logger from "../utils/Logger";
import path from "path";

const router = Router();
const USERS_FILE = path.join(__dirname, "..", "data", "users.json");

router.post("/register", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: "Username and password are required" });
      return;
    }

    const users = readJSON<User>(USERS_FILE);
    if (users.find((user) => user.username === username)) {
      res.status(400).json({ error: "Username already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User(
      users.length + 1,
      username,
      hashedPassword,
      new Date().toISOString(),
    );

    users.push(newUser);
    writeJSON(USERS_FILE, users);

    res.status(201).json({ message: "User registered" });
  } catch (error) {
    Logger.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
