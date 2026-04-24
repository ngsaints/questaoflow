import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const getQuestions = () => {
  const qPath = path.join(__dirname, '../../data/questions.json');
  return fs.existsSync(qPath) ? JSON.parse(fs.readFileSync(qPath, 'utf8')) : [];
};

const saveQuestions = (data) => {
  fs.writeFileSync(path.join(__dirname, '../../data/questions.json'), JSON.stringify(data, null, 2));
};

router.get('/', (req, res) => {
  const questions = getQuestions();
  const { status, disciplina, assunto, fileId } = req.query;

  let filtered = questions;

  if (status) filtered = filtered.filter(q => q.status === status);
  if (disciplina) filtered = filtered.filter(q => q.disciplina.toLowerCase().includes(disciplina.toLowerCase()));
  if (assunto) filtered = filtered.filter(q => q.assunto.toLowerCase().includes(assunto.toLowerCase()));
  if (fileId) filtered = filtered.filter(q => q.fileId === fileId);

  res.json({ questions: filtered, total: filtered.length });
});

router.get('/:id', (req, res) => {
  const questions = getQuestions();
  const question = questions.find(q => q.id === req.params.id);

  if (!question) return res.status(404).json({ error: 'Question not found' });
  res.json(question);
});

router.put('/:id', (req, res) => {
  try {
    const questions = getQuestions();
    const index = questions.findIndex(q => q.id === req.params.id);

    if (index === -1) return res.status(404).json({ error: 'Question not found' });

    const updatedQuestion = {
      ...questions[index],
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    questions[index] = updatedQuestion;
    saveQuestions(questions);

    res.json({ success: true, question: updatedQuestion });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const questions = getQuestions();
    const filtered = questions.filter(q => q.id !== req.params.id);

    if (filtered.length === questions.length) {
      return res.status(404).json({ error: 'Question not found' });
    }

    saveQuestions(filtered);
    res.json({ success: true, message: 'Question deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/export', (req, res) => {
  try {
    const { ids, format } = req.body;
    const questions = getQuestions();

    const toExport = ids ? questions.filter(q => ids.includes(q.id)) : questions;

    if (format === 'csv') {
      const headers = ['id', 'disciplina', 'assunto', 'enunciado', 'resposta_correta'];
      const rows = toExport.map(q => headers.map(h => `"${(q[h] || '').toString().replace(/"/g, '""')}"`).join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=questions.csv');
      return res.send(csv);
    }

    res.json({
      questions: toExport,
      total: toExport.length,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/batch-status', (req, res) => {
  try {
    const { ids, status } = req.body;
    const questions = getQuestions();

    let updated = 0;
    questions.forEach((q, i) => {
      if (ids.includes(q.id)) {
        questions[i].status = status;
        questions[i].updatedAt = new Date().toISOString();
        updated++;
      }
    });

    saveQuestions(questions);
    res.json({ success: true, updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
