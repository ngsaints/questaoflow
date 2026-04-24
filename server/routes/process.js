import express from 'express';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import Tesseract from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const getFiles = () => {
  const filesPath = path.join(__dirname, '../../data/files.json');
  return fs.existsSync(filesPath) ? JSON.parse(fs.readFileSync(filesPath, 'utf8')) : [];
};

const saveFiles = (data) => {
  fs.writeFileSync(path.join(__dirname, '../../data/files.json'), JSON.stringify(data, null, 2));
};

const getQuestions = () => {
  const qPath = path.join(__dirname, '../../data/questions.json');
  return fs.existsSync(qPath) ? JSON.parse(fs.readFileSync(qPath, 'utf8')) : [];
};

const saveQuestions = (data) => {
  fs.writeFileSync(path.join(__dirname, '../../data/questions.json'), JSON.stringify(data, null, 2));
};

const getMetrics = () => {
  const mPath = path.join(__dirname, '../../data/metrics.json');
  return fs.existsSync(mPath) ? JSON.parse(fs.readFileSync(mPath, 'utf8')) : {};
};

const saveMetrics = (data) => {
  fs.writeFileSync(path.join(__dirname, '../../data/metrics.json'), JSON.stringify(data, null, 2));
};

const parseQuestions = (text, metadata = {}) => {
  const questions = [];
  const normalizedText = text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  const questionBlocks = normalizedText.split(/(?=QUESTÃO\s*\d|^\d{1,3}\s*[.)])/gm)
    .filter(block => block.trim().length > 20)
    .map(block => block.trim());

  if (questionBlocks.length > 1) {
    questionBlocks.forEach((block, index) => {
      const question = extractQuestionFromBlock(block, index + 1, metadata);
      if (question) questions.push(question);
    });
  } else {
    const numberedQuestions = normalizedText.split(/(?=\n\d{1,3}\s*[.)]\s*)/g)
      .filter(q => /^\d{1,3}\s*[.)]/.test(q.trim()));

    if (numberedQuestions.length > 0) {
      numberedQuestions.forEach((block, index) => {
        const question = extractQuestionFromBlock(block, index + 1, metadata);
        if (question) questions.push(question);
      });
    } else {
      const singleQuestion = extractSingleQuestion(normalizedText, metadata);
      if (singleQuestion.enunciado) questions.push(singleQuestion);
    }
  }

  return questions.length > 0 ? questions : [createEmptyQuestion(metadata)];
};

const extractQuestionFromBlock = (block, index, metadata) => {
  const cleanBlock = block.replace(/^\d+\s*[.)]\s*/, '').trim();
  const enunciadoMatch = cleanBlock.match(/^([A-Z][^.!?]*[?])/);
  let enunciado = enunciadoMatch ? enunciadoMatch[1].trim() : cleanBlock.substring(0, 200).trim();

  if (!enunciado.match(/[?]$/)) {
    const sentences = enunciado.split(/[.!?]/);
    if (sentences.length > 1) {
      enunciado = sentences.slice(0, 2).join('.') + '?';
    } else {
      enunciado = enunciado + '?';
    }
  }

  const alternatives = {};
  const altRegex = /([A-E])\s*[.)]\s*([^]+?)(?=(?:[A-E]\s*[.)])|$)/gi;
  let altMatch;
  while ((altMatch = altRegex.exec(block)) !== null) {
    alternatives[altMatch[1].toUpperCase()] = altMatch[2].trim().substring(0, 500);
  }

  if (Object.keys(alternatives).length < 4) {
    const simpleAltRegex = /([A-E])\s*([^.!?\n]{10,200})/gi;
    const found = [];
    let simpleMatch;
    while ((simpleMatch = simpleAltRegex.exec(block)) !== null) {
      if (!found.includes(simpleMatch[1])) {
        alternatives[simpleMatch[1].toUpperCase()] = simpleMatch[2].trim();
        found.push(simpleMatch[1]);
      }
    }
  }

  const answerPatterns = [
    /resposta\s*(correta|certa|certo)?\:?\s*([A-E])/gi,
    /Gabarito\:?\s*([A-E])/gi,
    /Resposta\:?\s*([A-E])/gi,
    /Alternativa\s*([A-E])/gi,
    /Resp[\.:]\s*([A-E])/gi
  ];

  let respostaCorreta = null;
  for (const pattern of answerPatterns) {
    const match = block.match(pattern);
    if (match) {
      respostaCorreta = match[match.length - 1].toUpperCase();
      break;
    }
  }

  const resolucaoMatch = block.match(/Resolu(c)?(ão|ção)[\s:]*([^]+?)(?=Questão|$)/is);
  const resolucao = resolucaoMatch ? resolucaoMatch[3].trim() : '';

  return {
    id: `q_${Date.now()}_${index}`,
    disciplina: metadata.disciplina || '',
    assunto: metadata.assunto || '',
    subassunto: metadata.subassunto || '',
    banca: metadata.banca || '',
    ano: metadata.ano || null,
    nivel: metadata.nivel || '',
    enunciado: enunciado.substring(0, 2000),
    alternativas: Object.keys(alternatives).length >= 4 ? alternatives : createDefaultAlternatives(),
    resposta_correta: respostaCorreta || 'A',
    resolucao: resolucao.substring(0, 2000),
    imagens: []
  };
};

const extractSingleQuestion = (text, metadata) => {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let enunciado = '';
  const alternatives = {};

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    if (sentence.length > 30 && !enunciado) {
      enunciado = sentence.endsWith('?') ? sentence : sentence + '?';
    }
    if (enunciado && sentence.length > 10 && sentence.length < 300) {
      const firstChar = sentence[0];
      if (/[A-E]/.test(firstChar) && !sentence.startsWith('alternativa')) {
        alternatives[firstChar] = sentence;
      }
    }
  }

  return {
    id: `q_${Date.now()}`,
    disciplina: metadata.disciplina || '',
    assunto: metadata.assunto || '',
    subassunto: metadata.subassunto || '',
    banca: metadata.banca || '',
    ano: metadata.ano || null,
    nivel: metadata.nivel || '',
    enunciado: enunciado || text.substring(0, 200),
    alternativas: Object.keys(alternatives).length >= 4 ? alternatives : createDefaultAlternatives(),
    resposta_correta: 'A',
    resolucao: '',
    imagens: []
  };
};

const createDefaultAlternatives = () => ({
  A: 'Alternativa A',
  B: 'Alternativa B',
  C: 'Alternativa C',
  D: 'Alternativa D',
  E: 'Alternativa E'
});

const createEmptyQuestion = (metadata) => ({
  id: `q_${Date.now()}`,
  disciplina: metadata.disciplina || '',
  assunto: metadata.assunto || '',
  subassunto: metadata.subassunto || '',
  banca: metadata.banca || '',
  ano: metadata.ano || null,
  nivel: metadata.nivel || '',
  enunciado: 'Questão não pôde ser extraída automaticamente',
  alternativas: createDefaultAlternatives(),
  resposta_correta: 'A',
  resolucao: '',
  imagens: []
});

const validateQuestion = (question) => {
  const errors = [];
  const warnings = [];

  if (!question.enunciado || question.enunciado.trim().length < 5) {
    errors.push('Enunciado não pode estar vazio ou ser muito curto');
  }

  const alternatives = question.alternativas || {};
  const altKeys = Object.keys(alternatives).filter(k => /^[A-E]$/.test(k));

  if (altKeys.length < 4) {
    errors.push(`Mínimo de 4 alternativas necessárias (atualmente: ${altKeys.length})`);
  }

  if (altKeys.length > 5) {
    errors.push(`Máximo de 5 alternativas permitido (atualmente: ${altKeys.length})`);
  }

  const validAnswers = ['A', 'B', 'C', 'D', 'E'];
  if (!validAnswers.includes(question.resposta_correta)) {
    errors.push('Resposta correta deve ser uma das alternativas: A, B, C, D ou E');
  }

  const answerKey = question.resposta_correta?.toUpperCase();
  if (answerKey && !alternatives[answerKey]) {
    errors.push(`Alternativa ${answerKey} está marcada como correta mas não existe nas alternativas`);
  }

  if (question.enunciado && question.enunciado.length > 5000) {
    warnings.push('Enunciado muito longo (>5000 caracteres)');
  }

  for (const [key, value] of Object.entries(alternatives)) {
    if (!value || value.trim().length < 3) {
      warnings.push(`Alternativa ${key} parece estar vazia ou muito curta`);
    }
    if (value && value.length > 1000) {
      warnings.push(`Alternativa ${key} muito longa (>1000 caracteres)`);
    }
  }

  const hasLowConfidence = question.confidence && question.confidence < 0.7;
  if (hasLowConfidence) {
    warnings.push('Baixa confiança na extração');
  }

  return { valid: errors.length === 0, errors, warnings };
};

router.post('/:fileId', async (req, res) => {
  const startTime = Date.now();
  const { fileId } = req.params;
  const { metadata } = req.body;

  try {
    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[fileIndex];
    file.status = 'processing';
    file.metadata = metadata;
    saveFiles(files);

    let extractedText = '';
    let images = [];

    if (file.mimeType === 'application/pdf') {
      const pdfData = fs.readFileSync(file.path);
      const pdfDoc = await getDocument({ data: pdfData }).promise;
      let text = '';
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(item => item.str).join(' ') + '\n';
      }
      extractedText = text;

      if (!extractedText || extractedText.trim().length < 50) {
        file.status = 'needs_ocr';
        saveFiles(files);
        return res.status(400).json({
          error: 'PDF appears to be scanned. OCR processing required.',
          requiresOcr: true
        });
      }
    } else if (file.mimeType.startsWith('image/')) {
      const result = await Tesseract.recognize(file.path, 'por', {
        logger: m => { if (m.status === 'recognizing text') console.log(`OCR: ${Math.round(m.progress * 100)}%`); }
      });
      extractedText = result.data.text;
      images = result.data.words?.map(w => ({ text: w.text, confidence: w.confidence })) || [];
    }

    const parsedQuestions = parseQuestions(extractedText, metadata);

    const questions = getQuestions();
    const newQuestions = parsedQuestions.map(q => ({
      id: uuidv4(),
      fileId: file.id,
      ...q,
      confidence: extractedText ? 0.9 : 0.7,
      status: 'pending',
      createdAt: new Date().toISOString()
    }));

    const validatedQuestions = newQuestions.map(q => ({
      ...q,
      validation: validateQuestion(q)
    }));

    saveQuestions([...questions, ...validatedQuestions]);

    file.status = 'processed';
    file.processedAt = new Date().toISOString();
    file.questionsCount = validatedQuestions.length;
    saveFiles(files);

    const metrics = getMetrics();
    metrics.totalQuestions = (metrics.totalQuestions || 0) + validatedQuestions.length;
    metrics.processedFiles = (metrics.processedFiles || 0) + 1;
    metrics.lastUpdated = new Date().toISOString();
    saveMetrics(metrics);

    const processingTime = Date.now() - startTime;

    res.json({
      success: true,
      questions: validatedQuestions,
      processingTime,
      stats: { extracted: validatedQuestions.length, time: processingTime }
    });
  } catch (error) {
    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      files[fileIndex].status = 'error';
      files[fileIndex].error = error.message;
      saveFiles(files);
    }

    const metrics = getMetrics();
    metrics.failedFiles = (metrics.failedFiles || 0) + 1;
    metrics.lastUpdated = new Date().toISOString();
    saveMetrics(metrics);

    res.status(500).json({ error: error.message });
  }
});

router.post('/:fileId/ocr', async (req, res) => {
  const startTime = Date.now();
  const { fileId } = req.params;

  try {
    const files = getFiles();
    const fileIndex = files.findIndex(f => f.id === fileId);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[fileIndex];
    file.status = 'processing';
    saveFiles(files);

    const result = await Tesseract.recognize(file.path, 'por', {
      logger: m => console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`)
    });

    const extractedText = result.data.text;
    const parsedQuestions = parseQuestions(extractedText, file.metadata);

    const questions = getQuestions();
    const newQuestions = parsedQuestions.map(q => ({
      id: uuidv4(),
      fileId: file.id,
      ...q,
      confidence: result.data.confidence / 100,
      status: 'pending',
      createdAt: new Date().toISOString()
    }));

    const validatedQuestions = newQuestions.map(q => ({
      ...q,
      validation: validateQuestion(q)
    }));

    saveQuestions([...questions, ...validatedQuestions]);

    file.status = 'processed';
    file.processedAt = new Date().toISOString();
    file.questionsCount = validatedQuestions.length;
    saveFiles(files);

    const metrics = getMetrics();
    metrics.totalQuestions = (metrics.totalQuestions || 0) + validatedQuestions.length;
    metrics.processedFiles = (metrics.processedFiles || 0) + 1;
    metrics.lastUpdated = new Date().toISOString();
    saveMetrics(metrics);

    res.json({
      success: true,
      questions: validatedQuestions,
      processingTime: Date.now() - startTime
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
