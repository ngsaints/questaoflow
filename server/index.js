import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import winston from 'winston';
import fs from 'fs';

import uploadRoutes from './routes/upload.js';
import processRoutes from './routes/process.js';
import questionsRoutes from './routes/questions.js';
import metricsRoutes from './routes/metrics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: path.join(__dirname, '../logs/error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(__dirname, '../logs/combined.log') }),
    new winston.transports.Console({ format: winston.format.combine(winston.format.colorize(), winston.format.simple()) })
  ]
});

const uploadsDir = path.join(__dirname, '../uploads');
const imagesDir = path.join(__dirname, '../uploads/images');
const dataDir = path.join(__dirname, '../data');

[uploadsDir, imagesDir, dataDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const questionsFile = path.join(dataDir, 'questions.json');
if (!fs.existsSync(questionsFile)) {
  fs.writeFileSync(questionsFile, JSON.stringify([]));
}

const metricsFile = path.join(dataDir, 'metrics.json');
if (!fs.existsSync(metricsFile)) {
  fs.writeFileSync(metricsFile, JSON.stringify({
    totalFiles: 0,
    totalQuestions: 0,
    processedFiles: 0,
    failedFiles: 0,
    averageProcessingTime: 0,
    lastUpdated: new Date().toISOString()
  }));
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/api/upload', uploadRoutes);
app.use('/api/process', processRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/metrics', metricsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

export { app, logger };
