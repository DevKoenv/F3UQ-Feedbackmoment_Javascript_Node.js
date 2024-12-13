import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { DataStore } from "../utils/DataStore";

const router = express.Router();

const SECRET_KEY = "your_secret_key";
const REFRESH_SECRET_KEY = "your_refresh_secret_key";

const userStore = DataStore.getInstance<User>("users");
const refreshTokensStore = DataStore.getInstance<string>("refreshTokens");

// Route to register a new user
router.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      const users = userStore.getAll();

      if (users.find((user) => user.username === username)) {
        res.status(400).json({ error: "Username already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = new User(username, hashedPassword);

      userStore.create(newUser);

      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      next(error);
    }
  }
);

// Route to login a user
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        res.status(400).json({ error: "Username and password are required" });
        return;
      }

      const users = userStore.getAll();
      const user = users.find((u) => u.username === username);

      if (!user || !(await bcrypt.compare(password, user.password))) {
        res.status(401).json({ error: "Invalid username or password" });
        return;
      }

      // Generate JWT and Refresh Token
      const token = jwt.sign(
        { id: user.id, username: user.username },
        SECRET_KEY,
        { expiresIn: "1h" }
      );
      const refreshToken = jwt.sign(
        { id: user.id, username: user.username },
        REFRESH_SECRET_KEY,
        { expiresIn: "7d" }
      );

      // Save refresh token
      refreshTokensStore.create(refreshToken);

      res.json({ token, refreshToken });
    } catch (error) {
      next(error);
    }
  }
);

// Route to refresh the token
router.post(
  "/refresh-token",
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }

      const refreshTokens = refreshTokensStore.getAll();

      if (!refreshTokens.includes(refreshToken)) {
        res.status(403).json({ error: "Invalid refresh token" });
        return;
      }

      jwt.verify(refreshToken, REFRESH_SECRET_KEY, (err: any, user: any) => {
        if (err) {
          res.status(403).json({ error: "Invalid refresh token" });
          return;
        }

        const { id, username } = user as { id: string; username: string };

        const newToken = jwt.sign({ id, username }, SECRET_KEY, {
          expiresIn: "1h",
        });

        res.json({ token: newToken });
      });
    } catch (error) {
      next(error);
    }
  }
);

// Route to logout a user (removes refresh token)
router.post(
  "/logout",
  (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({ error: "Refresh token is required" });
        return;
      }

      const refreshTokens = refreshTokensStore.getAll();
      const index = refreshTokens.indexOf(refreshToken);

      if (index === -1) {
        res.status(403).json({ error: "Invalid refresh token" });
        return;
      }

      refreshTokensStore.delete(refreshToken);

      res.json({ message: "User logged out successfully" });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
