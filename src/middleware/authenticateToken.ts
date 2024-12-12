import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import Logger from '../utils/Logger';

const SECRET_KEY = 'your_secret_key';

interface TokenPayload {
  id: number;
  username: string;
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    Logger.warn('Token missing in request');
    return res.status(401).json({ error: 'Token missing' });
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      Logger.error('Invalid token provided');
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user as TokenPayload;
    next();
  });
};