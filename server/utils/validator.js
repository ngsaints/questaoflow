const crypto = require('crypto');

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

  const hash = generateHash(question);
  const hasDuplicate = checkDuplicateHash(hash, question.id);
  if (hasDuplicate) {
    warnings.push('Possível questão duplicada detectada');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    hash
  };
};

const generateHash = (question) => {
  const content = `${question.enunciado}|${JSON.stringify(question.alternativas)}`;
  return crypto.createHash('md5').update(content).digest('hex');
};

const recentHashes = new Map();

const checkDuplicateHash = (hash, questionId) => {
  if (recentHashes.has(hash) && recentHashes.get(hash) !== questionId) {
    return true;
  }
  recentHashes.set(hash, questionId);

  if (recentHashes.size > 1000) {
    const firstKey = recentHashes.keys().next().value;
    recentHashes.delete(firstKey);
  }

  return false;
};

const validateBatch = (questions) => {
  const results = questions.map(q => ({
    question: q,
    validation: validateQuestion(q)
  }));

  const validCount = results.filter(r => r.validation.valid).length;
  const invalidCount = results.length - validCount;

  return {
    results,
    summary: {
      total: questions.length,
      valid: validCount,
      invalid: invalidCount,
      successRate: questions.length > 0 ? (validCount / questions.length * 100).toFixed(1) : 0
    }
  };
};

module.exports = { validateQuestion, validateBatch, generateHash };
