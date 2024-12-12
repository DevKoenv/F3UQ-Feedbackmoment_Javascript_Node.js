import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { readJSON, writeJSON } from '../utils/fileUtils';
import Logger from '../utils/Logger';

const router = express.Router();
const SECRET_KEY = 'your_secret_key';
const USERS_FILE = './data/users.json';

router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    Logger.warn('Missing username or password during registration');
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const users = readJSON<User>(USERS_FILE);
  if (users.find((user) => user.username === username)) {
    Logger.warn('Username already exists');
    return res.status(400).json({ error: 'Username already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User(users.length + 1, username, hashedPassword, new Date().toISOString());

  users.push(newUser);
  writeJSON(USERS_FILE, users);

  Logger.log(`User registered: ${username}`);
  res.status(201).json({ message: 'User registered' });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const users = readJSON<User>(USERS_FILE);
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    Logger.error('Invalid login attempt');
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
  Logger.log(`User logged in: ${username}`);
  res.json({ token });
});

export default router;
