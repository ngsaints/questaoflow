import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const getMetrics = () => {
  const mPath = path.join(__dirname, '../../data/metrics.json');
  return fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, 'utf8')) : {};
};

const getFiles = () => {
  const fPath = path.join(__dirname, '../../data/files.json');
  return fs.existsSync(fPath) ? JSON.parse(fs.readFileSync(fPath, 'utf8')) : [];
};

const getQuestions = () => {
  const qPath = path.join(__dirname, '../../data/questions.json');
  return fs.existsSync(qPath) ? JSON.parse(fs.readFileSync(qPath, 'utf8')) : [];
};

router.get('/', (req, res) => {
  const metrics = getMetrics();
  const files = getFiles();
  const questions = getQuestions();

  const statusCounts = {
    pending: questions.filter(q => q.status === 'pending').length,
    reviewed: questions.filter(q => q.status === 'reviewed').length,
    approved: questions.filter(q => q.status === 'approved').length,
    rejected: questions.filter(q => q.status === 'rejected').length
  };

  const filesByStatus = {
    pending: files.filter(f => f.status === 'pending').length,
    processing: files.filter(f => f.status === 'processing').length,
    processed: files.filter(f => f.status === 'processed').length,
    error: files.filter(f => f.status === 'error').length
  };

  const disciplineStats = questions.reduce((acc, q) => {
    const key = q.disciplina || 'Unknown';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  res.json({
    ...metrics,
    questionsByStatus: statusCounts,
    filesByStatus: filesByStatus,
    disciplineStats,
    totalQuestions: questions.length
  });
});

router.get('/history', (req, res) => {
  const files = getFiles();
  const history = files
    .filter(f => f.processedAt)
    .map(f => ({
      id: f.id,
      filename: f.originalName,
      status: f.status,
      questionsCount: f.questionsCount || 0,
      processedAt: f.processedAt,
      processingTime: f.processingTime || 0
    }))
    .sort((a, b) => new Date(b.processedAt) - new Date(a.processedAt));

  res.json({ history });
});

export default router;
