# Extração de Dados - OCR & Parsing

## Fluxo de Processamento

```
PDF/Imagem → Texto extraído → Parser de questões → JSON estruturado
```

## Extração de Dados

### PDFs nativos (com texto)

```
pdfjs-dist carrega o PDF → Extrai texto página por página → Preserva parágrafos/tabelas
```

- Leitura direta do conteúdo de texto
- Mantém estrutura (parágrafos, listas)
- Sem OCR necessário

### PDFs escaneados / Imagens

```
Arquivo → Canvas (pré-processamento) → Tesseract.js (OCR) → Texto
```

- Converter página/imagem para canvas
- Pré-processamento: escala cinza, binarização, contraste
- Tesseract.js reconhece texto em português
- Saída: texto puro linha por linha

### Pré-processamento de imagem

```javascript
// Redução de ruído + contraste
1. Convertendo para grayscale
2. Aplicando threshold/binarização
3. Removendo ruído (morphological ops)
4. Aumentando contraste
```

## Bibliotecas

- `pdfjs-dist` - PDFs (nativos e escaneados)
- `tesseract.js` - OCR (imagens e PDFs escaneados)
- `sharp` (opcional) - Pré-processamento de imagem

## Fluxo Completo

```
Upload → Detect tipo →
    ├── PDF texto → pdfjs-dist
    ├── PDF escaneado → pdfjs-dist (imagem) + Tesseract
    └── Imagem → Tesseract
         ↓
    Texto extraído → Parser → Questões JSON
```

## Parsing de Questões

### 1. OCR (Tesseract.js)

- Imagens e PDFs escaneados → Tesseract.js (português)
- Pré-processamento: redução de ruído, binarização
- Extrai texto linha por linha

### 2. Extração de PDF nativo (pdfjs-dist)

- PDFs com texto selecionável → Extração direta
- Mantém layout e posições

### 3. Parser (regex + heurísticas)

- Detecta enunciado (texto antes das alternativas)
- Identifica alternativas por padrões: `A)`, `A.`, `A -`, `A:` etc.
- Extrai resposta correta por padrões como `( )`, `[ ]`, `*`, negrito
- Separa resolução quando presente

### 4. Validação

- Enunciado não vazio
- 4-5 alternativas
- 1 resposta correta
- Score de confiança

### 5. LLM (opcional - GROQ/OpenAI)

- Para casos ambíguos, LLM refina o parsing

## Resultado

```json
{
  "enunciado": "Qual a capital do Brasil?",
  "alternativas": {
    "A": "São Paulo",
    "B": "Rio de Janeiro",
    "C": "Brasília",
    "D": "Belo Horizonte",
    "E": "Salvador"
  },
  "resposta_correta": "C",
  "resolucao": "Brasília é a capital do Brasil..."
}
```
