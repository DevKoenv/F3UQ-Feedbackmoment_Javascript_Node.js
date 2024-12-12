import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Logger from "../utils/Logger";

const SECRET_KEY = "your_secret_key";

interface TokenPayload {
  id: number;
  username: string;
}

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Token missing" });
    return;
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      Logger.error(err);
      res.status(403).json({ error: "Invalid token" });
      return;
    }
    res.locals.user = user as TokenPayload; // Store the user in res.locals
    next();
  });
};
