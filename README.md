# QuestãoFlow

Sistema de extração automatizada de questões a partir de arquivos PDF e imagens, convertendo-os em JSON estruturado para integração com banco de dados.

## Stack

- **Backend:** Node.js + Express
- **Frontend:** React 19 + Vite
- **OCR:** Tesseract.js
- **PDF:** pdfjs-dist
- **Estado:** Zustand + JSON files

## Funcionalidades

- Upload de PDF (texto e escaneado) e imagens
- OCR com Tesseract.js (português)
- Extração de texto de PDFs nativos
- Parsing inteligente de questões (A-E)
- Identificação de resposta correta
- Validação automática
- Editor inline
- Export JSON
- Dashboard com métricas

## Instalação

```bash
# Clonar repositório
git clone https://github.com/ngsaints/questaoflow.git
cd questaoflow

# Instalar dependências
npm install
cd client && npm install
```

## Executar

```bash
# Terminal 1 - Backend (porta 3001)
npm run dev

# Terminal 2 - Frontend (porta 5173)
cd client && npm run dev
```

## Variáveis de Ambiente

```env
PORT=3001
GEMINI_API_KEY=sua_chave_aqui  # Opcional - para parsing com LLM
```

## API Endpoints

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/upload` | Upload de arquivos |
| GET | `/api/files` | Listar arquivos |
| POST | `/api/process/:fileId` | Processar arquivo |
| GET | `/api/questions` | Listar questões |
| PUT | `/api/questions/:id` | Editar questão |
| DELETE | `/api/questions/:id` | Deletar questão |
| POST | `/api/export` | Exportar JSON |
| GET | `/api/metrics` | Métricas |

## Estrutura

```
├── server/              # Backend
│   ├── routes/          # API routes
│   └── utils/           # Parser e validator
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/ # Layout
│   │   └── pages/       # Dashboard, Upload, Process, Results, History
│   └── ...
├── data/                # JSON storage
├── uploads/              # Arquivos carregados
└── docs/                 # Documentação
```

## Formato JSON de Questão

```json
{
  "id": "uuid",
  "fileId": "uuid",
  "disciplina": "Matemática",
  "assunto": "Álgebra",
  "enunciado": "Qual o valor de x?",
  "alternativas": {
    "A": "10",
    "B": "20",
    "C": "30",
    "D": "40",
    "E": "50"
  },
  "resposta_correta": "C",
  "resolucao": "x = 30 porque...",
  "validation": {
    "isValid": true,
    "errors": []
  },
  "confidence": 0.95
}
```

## Fluxo

```
Upload → Metadata → Processamento → Revisão → Export
   ↓         ↓           ↓            ↓
  PDF/IMG   Disciplina   OCR+Parse   Editar    JSON
            Assunto      Validar     Validar
```

## Electron (Futuro)

O projeto pode ser transformado em aplicativo desktop com Electron para execução offline.

Ver [docs/GEMINI_INTEGRATION.md](docs/GEMINI_INTEGRATION.md) para detalhes.

## Licença

MIT
