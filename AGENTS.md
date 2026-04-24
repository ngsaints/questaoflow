# AGENTS.md - QuestãoFlow

## Visão Geral

QuestãoFlow é um sistema de extração automatizada de questões a partir de arquivos PDF e imagens, convertendo-os em JSON estruturado para integração com banco de dados.

## Stack Tecnologica

- **Backend:** Node.js + Express (ES Modules)
- **Frontend:** React 19 + Vite
- **OCR:** Tesseract.js
- **PDF Processing:** pdfjs-dist
- **Estado:** Zustand (frontend), arquivos JSON (backend)
- **Rotas:** React Router v7

## Comandos de Execução

### Desenvolvimento

```bash
# Terminal 1 - Backend (porta 3001)
npm run dev

# Terminal 2 - Frontend (porta 5173)
cd client && npm run dev
```

### Build Produção

```bash
cd client && npm run build
```

## Arquitetura

### Backend (`/server`)

```
server/
├── index.js           # Entry point, middleware, rotas
└── routes/
    ├── upload.js       # Upload de arquivos (PDF, JPG, PNG)
    ├── process.js     # OCR + parsing de questões
    ├── questions.js   # CRUD de questões
    └── metrics.js     # Dashboard metrics
```

**APIs Principais:**
- `POST /api/upload` - Upload de arquivos
- `POST /api/process/:fileId` - Processar arquivo
- `POST /api/process/:fileId/ocr` - OCR para PDFs escaneados
- `GET /api/questions` - Listar questões (com filtros)
- `PUT /api/questions/:id` - Editar questão
- `POST /api/questions/export` - Exportar JSON
- `GET /api/metrics` - Métricas do dashboard

### Frontend (`/client`)

```
client/src/
├── App.jsx            # Rotas principais
├── main.jsx           # Entry point React
├── index.css          # Estilos globais
├── components/
│   └── Layout.jsx     # Sidebar + Outlet
└── pages/
    ├── Dashboard.jsx   # Métricas e overview
    ├── Upload.jsx      # Upload de arquivos
    ├── Process.jsx     # Metadata + processamento
    ├── Results.jsx     # Review questões extraídas
    └── History.jsx     # Histórico processamento
```

### Armazenamento (`/data`)

```json
{
  "files.json": [{ id, originalName, filename, path, size, mimeType, status, metadata, processedAt }],
  "questions.json": [{ id, fileId, disciplina, assunto, enunciado, alternativas, resposta_correta, resolucao, validation }],
  "metrics.json": { totalQuestions, processedFiles, failedFiles, lastUpdated }
}
```

## Funcionalidades

### 1. Upload
- Drag & drop
- PDF nativo ou escaneado
- Imagens (JPG, PNG)
- Máximo 50MB por arquivo
- Batch upload (até 10 arquivos)

### 2. Processamento
- Extração de texto de PDFs nativos (pdfjs-dist)
- OCR com Tesseract.js (português)
- Parsing inteligente de questões
- Detecção de alternativas (A-E)
- Identificação de resposta correta
- Extração de resolução

### 3. Validação
- Enunciado não vazio
- Mínimo 4 alternativas
- Máximo 5 alternativas
- Resposta correta existe
- Detecção de duplicidade por hash
- Score de confiança

### 4. Revisão
- Visualização de questões extraídas
- Edição inline
- Export JSON

## Configurações

Ver `docs/CONFIG.md` para detalhes de configuração.

## Variáveis de Ambiente

```env
PORT=3001
GROQ_API_KEY=your_key_here  # Para futura integração LLM
```

## Debugging

### Backend não inicia
```bash
node --trace-warnings server/index.js
```

### Verificar logs
```bash
Get-Content logs/combined.log -Tail 50
```

### Resetar dados
```powershell
# Apagar todos os dados processados
Remove-Item data/*.json
Remove-Item uploads/*
Remove-Item logs/*
```