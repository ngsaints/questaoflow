# CONFIG.md - Configurações do QuestãoFlow

## Estrutura de Diretórios

```
questao-flow/
├── server/              # Backend Node.js
│   ├── index.js         # Entry point
│   └── routes/          # API routes
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/  # Componentes React
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── stores/     # Estado Zustand
│   │   └── utils/      # Utilitários
│   └── public/          # Arquivos estáticos
├── uploads/             # Arquivos enviados
│   └── images/          # Imagens extraídas
├── data/                # Persistência JSON
│   ├── files.json      # Metadados dos arquivos
│   ├── questions.json  # Questões extraídas
│   └── metrics.json    # Métricas do sistema
├── logs/                # Logs da aplicação
└── docs/                # Documentação
```

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Server
PORT=3001

# LLM Integration (opcional, para parsing avançado)
GROQ_API_KEY=your_groq_api_key_here
```

## Configuração do Backend

### Portas

- **API Backend:** 3001 (padrão)
- **Frontend Dev:** 5173

### Limites

- **Tamanho máximo de arquivo:** 50MB
- **Extensões permitidas:** .pdf, .jpg, .jpeg, .png
- **Batch upload:** máximo 10 arquivos por vez

### Armazenamento

Os dados são armazenados em arquivos JSON no diretório `/data`:
- `files.json` - Controle de arquivos enviados
- `questions.json` - Questões extraídas
- `metrics.json` - Estatísticas do sistema

## Configuração do Frontend

### Proxy API

O Vite está configurado para fazer proxy das requisições `/api` para `http://localhost:3001`.

### Rotas

| Path | Componente | Descrição |
|------|------------|-----------|
| `/` | Dashboard | Visão geral e métricas |
| `/upload` | Upload | Upload de arquivos |
| `/process` | Process | Processamento e metadados |
| `/results` | Results | Review das questões |
| `/history` | History | Histórico de processamento |

## API Endpoints

### Upload

```
POST /api/upload
Content-Type: multipart/form-data

Response: { success, files: [{ id, originalName, ... }] }
```

### Processamento

```
POST /api/process/:fileId
Body: { metadata: { disciplina, assunto, ... } }

Response: { success, questions: [...], processingTime }
```

### OCR (para PDFs escaneados)

```
POST /api/process/:fileId/ocr

Response: { success, questions: [...] }
```

### Questões

```
GET /api/questions?status=pending&disciplina=Matemática
PUT /api/questions/:id
Body: { enunciado, alternativas, ... }
DELETE /api/questions/:id
POST /api/questions/export
Body: { ids?: [...], format?: 'json' | 'csv' }
```

### Métricas

```
GET /api/metrics
GET /api/metrics/history
```

## Estrutura do Objeto Questão

```typescript
interface Question {
  id: string;              // UUID
  fileId: string;          // ID do arquivo de origem
  disciplina: string;      // ex: "Matemática"
  assunto: string;         // ex: "Álgebra"
  subassunto?: string;     // ex: "Equações"
  banca?: string;          // ex: "ENEM"
  ano?: number;            // ex: 2022
  nivel?: string;          // ex: "Médio"
  enunciado: string;       // Texto da questão
  alternativas: {          // Objeto com alternativas A-E
    A: string;
    B: string;
    C: string;
    D: string;
    E: string;
  };
  resposta_correta: string; // ex: "C"
  resolucao?: string;       // Explicação da resposta
  imagens?: string[];       // Paths das imagens extraídas
  confidence: number;      // Score 0-1
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
    hash?: string;
  };
  createdAt: string;       // ISO date
  updatedAt?: string;      // ISO date
}
```

## Comandos Úteis

### Iniciar desenvolvimento
```bash
npm run dev           # Backend
cd client && npm run dev  # Frontend
```

### Build produção
```bash
npm run build         # Ou cd client && npm run build
```

### Verificar logs
```powershell
Get-Content logs/combined.log -Tail 100 -Wait
```

### Resetar dados
```powershell
Remove-Item data/*.json -Force
Remove-Item uploads/* -Recurse -Force
```

### Listar questões extraídas
```powershell
Get-Content data/questions.json | ConvertFrom-Json | Select-Object -First 5
```

## Dependências

### Backend
- express@5.2.1
- cors@2.8.6
- multer@2.1.1
- pdfjs-dist@4.9.155
- tesseract.js@7.0.0
- uuid@14.0.0
- winston@3.19.0
- dotenv@17.4.2

### Frontend
- react@19.2.5
- react-dom@19.2.5
- react-router-dom@7.14.2
- @tanstack/react-query@5.99.2
- axios@1.15.2
- zustand@5.0.12
- lucide-react@1.8.0
- react-dropzone@14.2.3
- @vitejs/plugin-react@6.0.1
- vite@8.0.10

## Solução de Problemas

### Backend não inicia
```bash
node --trace-warnings server/index.js
```

### Problemas de CORS
Verificar se backend está rodando na porta correta e se frontend faz proxy corretamente.

### OCR não funciona
- Verificar se Tesseract.js está instalado
- Verificar se o arquivo não está corrompido
- PDFs escaneados precisam de OCR (rota `/api/process/:fileId/ocr`)

### Arquivo não é processado
- Verificar tamanho (máximo 50MB)
- Verificar extensão (.pdf, .jpg, .png)
- Verificar se não está corrompido