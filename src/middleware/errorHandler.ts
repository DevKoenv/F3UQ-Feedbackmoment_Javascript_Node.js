import type { ErrorRequestHandler } from 'express';
import Logger from '../utils/Logger';

export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;

  Logger.error(`[${req.method}] ${req.url} - ${err.message}`);
  res.status(statusCode).json({
    error: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
