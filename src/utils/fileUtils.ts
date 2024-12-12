import fs from 'fs';
import path from 'path';
import Logger from './Logger';

export const readJSON = <T>(filePath: string): T[] => {
  if (!fs.existsSync(filePath)) return [];
  const data = fs.readFileSync(filePath, 'utf8');
  Logger.log(`Read data from ${filePath}`);
  return JSON.parse(data);
};

export const writeJSON = (filePath: string, data: any): void => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  Logger.log(`Wrote data to ${filePath}`);
};