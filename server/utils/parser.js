const parseQuestions = (text, metadata = {}) => {
  const questions = [];

  const normalizedText = text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const questionPatterns = [
    /(\d+)[�.]?\s*([A-Z][^.!?]*[?])/g,
    /QUESTÃO\s*(\d+)[.:]\s*([A-Z][^.!?]*)/gi,
    /(\d+)\)\s*([A-Z][^.!?]*)/g,
    /^\s*(\d{1,3})\s*[.)]\s*(.+?)(?=\n\s*[A-E]\s*[.)]|$\n)/gms
  ];

  let pattern1Regex = /(\d+)[.)]\s*([A-Z][^.!?]*\?)([^]*?)(?=\n\s*[A-E]\s*[.)]|$\n)/g;

  const questionBlocks = normalizedText.split(/(?=QUESTÃO\s*\d|^\d{1,3}\s*[.)])/gm)
    .filter(block => block.trim().length > 20)
    .map(block => block.trim());

  if (questionBlocks.length > 1) {
    questionBlocks.forEach((block, index) => {
      const question = extractQuestionFromBlock(block, index + 1, metadata);
      if (question) {
        questions.push(question);
      }
    });
  } else {
    const numberedQuestions = normalizedText.split(/(?=\n\d{1,3}\s*[.)]\s*)/g)
      .filter(q => /^\d{1,3}\s*[.)]/.test(q.trim()));

    if (numberedQuestions.length > 0) {
      numberedQuestions.forEach((block, index) => {
        const question = extractQuestionFromBlock(block, index + 1, metadata);
        if (question) {
          questions.push(question);
        }
      });
    } else {
      const singleQuestion = extractSingleQuestion(normalizedText, metadata);
      if (singleQuestion.enunciado) {
        questions.push(singleQuestion);
      }
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
      enunciado = sentences.slice(0, 2).join('.').trim() + '?';
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
    /resposta\s*(correta| Certain| certo)?\:?\s*([A-E])/gi,
    / Gabarito\:?\s*([A-E])/gi,
    / Resposta\:?\s*([A-E])/gi,
    / Alternativa\s*([A-E])/gi,
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

module.exports = { parseQuestions };
