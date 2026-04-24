# Integração Gemini API

## Visão Geral

O **Gemini** é utilizado para **parsing inteligente** das questões, não para OCR. Enquanto Tesseract/pdfjs extraem o texto bruto, o Gemini interpreta e estrutura em JSON.

## Fluxo Completo

```
Upload → OCR/Extração (Tesseract/pdfjs) → Texto bruto → Gemini API → Questões JSON
```

## Onde o Gemini Entra

1. **Parsing inteligente** - Substitui regex/heurísticas por LLM que entende contexto
2. **Questões ambíguas** - Textos mal formatados, tabelas, layouts não convencionais
3. **Geração de resolução** - Quando não existe resolução no texto, o Gemini pode gerar
4. **Validação semântica** - Verifica se alternativas make sense
5. **Enriquecimento** - Adiciona tags, nível de dificuldade, etc.

## Divisão de Responsabilidades

| Etapa | Tecnologia | Função |
|-------|------------|--------|
| OCR | Tesseract.js / pdfjs-dist | Extrai texto de imagens/PDFs |
| Parsing | Gemini API | Interpreta texto e estrutura em JSON |

## Exemplo de Prompt Gemini

```
Analise o texto e extraia todas as questões de múltipla escolha.

Texto:
{todo_texto_extraido_do_arquivo}

Retorne APENAS JSON válido neste formato:
{
  "questoes": [
    {
      "enunciado": "pergunta completa",
      "alternativas": {
        "A": "primeira opção",
        "B": "segunda opção",
        "C": "terceira opção",
        "D": "quarta opção",
        "E": "quinta opção"
      },
      "resposta_correta": "A|B|C|D|E",
      "resolucao": "explicação da resposta (se disponível no texto, caso contrário null)"
    }
  ]
}

Regras:
- Ignore textos que não sejam questões de múltipla escolha
- Mantenha o enunciado completo e fiel ao original
-preserve formatação matemática se houver
- resposta_correta deve ser apenas uma letra (A, B, C, D ou E)
- Se não houver resolução no texto, use null
```

## Configuração

### Variável de Ambiente

```env
GEMINI_API_KEY=sua_chave_aqui
```

### Exemplo de Chamada

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function parseQuestions(text) {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const result = await model.generateContent({
    contents: [{
      role: 'user',
      parts: [{
        text: `Analise o texto e extraia todas as questões de múltipla escolha.\n\nTexto:\n${text}\n\nRetorne APENAS JSON válido...`
      }]
    }],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.1
    }
  });

  return JSON.parse(result.response.text());
}
```

## Estratégia Híbrida (Fallback)

```
1. Primeiro tenta regex/heurísticas (rápido, offline)
2. Se confiança baixa ou falhar → chama Gemini
3. Gemini refina e estrutura
```

## Considerações

- **Custo**: Chamadas API têm custo por token
- **Velocidade**: Regex é instantâneo, Gemini leva ~1-3s
- **Confiança**: Usar score para decidir se precisa de Gemini
- **Fallback**: Sempre ter parsing regex como backup

---

# Transformação para Electron

## Visão Geral

O QuestãoFlow pode ser transformado em **aplicativo desktop** usando Electron, permitindo execução local sem necessidade de servidor backend separado.

## Arquitetura Proposta

```
┌─────────────────────────────────────────────┐
│              Electron App                    │
├─────────────────────────────────────────────┤
│  Renderer Process (React)                   │
│  ├── UI (React + Tailwind)                  │
│  ├── Estado (Zustand)                       │
│  └── Comunicação IPC                        │
├─────────────────────────────────────────────┤
│  Main Process (Node.js)                     │
│  ├── OCR (Tesseract.js)                     │
│  ├── PDF (pdfjs-dist)                       │
│  ├── File System                            │
│  ├── Gemini API (opcional)                  │
│  └── IPC Handlers                           │
└─────────────────────────────────────────────┘
```

## Stack Atual → Electron

| Componente | Atual | Electron |
|------------|-------|----------|
| Frontend | React + Vite (localhost:5173) | React (embedded) |
| Backend | Express (localhost:3001) | Main Process |
| OCR | Tesseract.js (browser) | Tesseract.js (Node) |
| PDF | pdfjs-dist (browser) | pdfjs-dist (Node) |
| Storage | JSON files | JSON files (app data) |

## Dependências Adicionais

```bash
npm install electron electron-builder concurrently wait-on
npm install --save-dev electron
```

## Estrutura de Pastas

```
questaoflow/
├── electron/
│   ├── main.js           # Main process
│   ├── preload.js        # Preload script (IPC)
│   └── ipc/              # IPC handlers
│       ├── files.js
│       ├── ocr.js
│       └── process.js
├── src/                  # React frontend (existente)
├── public/                # Assets estáticos
├── package.json
└── electron-builder.yml
```

## Configuração Main Process

```javascript
// electron/main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  win.loadURL('http://localhost:5173');
}

app.whenReady().then(createWindow);
```

## Configuração Build

```yaml
# electron-builder.yml
appId: com.questaoflow.app
productName: QuestãoFlow
directories:
  output: dist-electron
files:
  - dist/**/*
  - node_modules/**/*
  - electron/**/*
```

## Vantagens do Electron

1. **Offline** - Funciona sem conexão internet (exceto Gemini)
2. **Instalável** - .exe instalável para Windows
3. **File System** - Acesso direto ao sistema de arquivos
4. **Performance** - OCR mais rápido em Node.js
5. **Distribuição** - Fácil distribuição via installer

## Desvantagens

1. **Tamanho** - App grande (~150MB+)
2. **Updates** - Necessita sistema de auto-update
3. **Segurança** - Mais superfície de ataque
4. **Recursos** - Consome mais RAM que web app

## Comandos

```bash
# Desenvolvimento
npm run electron:dev

# Build produção
npm run electron:build
```

## Migração Passo a Passo

1. Criar pasta `electron/` com `main.js` e `preload.js`
2. Configurar IPC handlers para OCR e file system
3. Mover lógica do backend (Express) para main process
4. Ajustar frontend para usar IPC em vez de fetch
5. Configurar electron-builder para build
6. Testar desenvolvimento com `npm run electron:dev`
7. Build final com `npm run electron:build`

## Recursos Desktop (Extras)

- Acesso direto a arquivos locais
- Menu nativo do sistema
- Notificações desktop
- Drag & drop de arquivos
- Atalhos de teclado globais
- Bandeja do sistema (minimize to tray)
