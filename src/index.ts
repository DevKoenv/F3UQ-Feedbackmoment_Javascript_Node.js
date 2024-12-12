import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import Logger from './utils/Logger';
import authRoutes from './routes/authRoutes';
// import eventRoutes from './routes/eventRoutes';

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/auth', authRoutes);
// app.use('/events', eventRoutes);

app.listen(PORT, () => {
  Logger.ready(`Server is running on http://localhost:${PORT}`);
});
