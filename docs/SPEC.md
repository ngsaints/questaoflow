# SPEC.md - Especificação Técnica

## 1. Project Overview

- **Name**: QuestãoFlow
- **Type**: Web Application (Node.js + Express + React)
- **Core Functionality**: Automated ingestion and processing of questions from PDF and image files, converting them into structured JSON for database integration.
- **Target Users**: Educational platforms, exam preparation systems, content creators

## 2. UI/UX Specification

### 2.1 Layout Structure

**Pages:**
1. **Dashboard** (`/`) — Main control panel with metrics and quick actions
2. **Upload** (`/upload`) — File upload interface with drag & drop
3. **Process** (`/process`) — Metadata assignment and processing controls
4. **Results** (`/results`) — Question review and validation interface
5. **History** (`/history`) — Processing logs and metrics

**Responsive:** Mobile-first, breakpoints at 768px and 1024px

### 2.2 Visual Design

**Color Palette:**
- Primary: `#1a1a2e` (deep navy)
- Secondary: `#16213e` (dark blue)
- Accent: `#e94560` (coral red)
- Success: `#00d9a5` (mint green)
- Warning: `#ffc107` (amber)
- Error: `#ff4757` (red)
- Background: `#0f0f1a` (near black)
- Surface: `#1a1a2e` (card backgrounds)
- Text Primary: `#ffffff`
- Text Secondary: `#a0a0b0`
- Border: `#2d2d44`

**Typography:**
- Font Family: `'Inter', sans-serif` (headings), `'JetBrains Mono', monospace` (code/data)
- Headings: 2rem (h1), 1.5rem (h2), 1.25rem (h3)
- Body: 0.875rem (14px)
- Small: 0.75rem (12px)

**Spacing System:**
- Base unit: 4px
- Margins: 16px, 24px, 32px
- Padding: 8px, 12px, 16px, 24px
- Border radius: 8px (small), 12px (medium), 16px (large)

**Effects:**
- Cards: `box-shadow: 0 4px 20px rgba(0,0,0,0.3)`
- Hover transitions: `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`
- Gradients: `linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)`
- Glass effect: `background: rgba(26,26,46,0.8); backdrop-filter: blur(10px)`

### 2.3 Components

**Navigation Sidebar:**
- Width: 260px (collapsible to 72px)
- Icons with labels
- Active state: accent color left border + background tint
- Hover: subtle background change

**File Upload Zone:**
- Dashed border (2px dashed #2d2d44)
- Drag over: border color changes to accent
- File preview cards with thumbnail

**Question Cards:**
- Status indicator (colored dot)
- Expandable/collapsible
- Inline edit capability
- Confidence score badge

**Buttons:**
- Primary: accent background, white text
- Secondary: transparent, border, white text
- Ghost: no border, text only
- States: hover (lighten 10%), active (darken 5%), disabled (opacity 0.5)

**Input Fields:**
- Dark background (#0f0f1a)
- Border: 1px solid #2d2d44
- Focus: border color accent
- Error: border color error

**Progress Indicators:**
- Circular spinner for loading
- Linear progress bar for processing
- Step indicator for multi-step flows

**Toast Notifications:**
- Position: bottom-right
- Auto-dismiss: 5s
- Types: success, error, warning, info

## 3. Functionality Specification

### 3.1 Core Features

**File Upload:**
- Drag & drop zone
- File browser fallback
- Supported formats: PDF, JPG, PNG
- Max file size: 50MB (configurable)
- Batch upload support
- File preview with metadata

**Metadata Assignment:**
- Discipline (required): dropdown with search
- Subject (required): dropdown dependent on discipline
- Sub-subject (optional): free text or dropdown
- Bank/Source (optional): dropdown
- Year (optional): number input or range
- Level (optional): Easy, Medium, Hard, Expert

**OCR Processing:**
- Tesseract.js for client-side OCR
- Server-side fallback with pdfjs-dist
- Portuguese language support
- Noise reduction preprocessing
- Layout preservation

**Question Parsing:**
- Regex-based structure detection
- LLM-assisted parsing (OpenAI/Groq integration)
- Automatic alternative detection (A, B, C, D, E)
- Answer key identification patterns
- Resolution extraction

**Validation Rules:**
- Enunciado não vazio
- Mínimo 4 alternativas
- Máximo 5 alternativas
- Apenas 1 resposta correta
- JSON válido
- Duplicate detection via hash

**Export:**
- Single JSON download
- Batch JSON export
- API integration with retry logic

### 3.2 User Interactions

- Drag files → immediate upload start
- Assign metadata → instant preview update
- Process button → real-time progress
- Click question → expand inline editor
- Edit inline → auto-save with debounce
- Export → file download or API push

### 3.3 Data Flow

```
Upload → Store Temp → Metadata Form → Processing Queue
    ↓
Worker: OCR/Extract → Parse → Validate → Store Results
    ↓
Review (if needed) → Export/Integrate
```

### 3.4 Edge Cases

- Empty PDF (no text/images)
- Corrupt file handling
- Very long questions (>10000 chars)
- Questions with images only (no text)
- Multiple questions in same page
- Non-standard alternative format
- Mixed languages in content

## 4. Technical Specification

### 4.1 Backend (Node.js + Express)

**Dependencies:**
- express: Web framework
- multer: File upload handling
- pdfjs-dist: PDF text extraction
- tesseract.js: OCR engine
- groq: LLM integration
- uuid: ID generation
- cors: CORS handling
- dotenv: Environment variables
- winston: Logging

**API Endpoints:**
- `POST /api/upload` — Upload files
- `GET /api/files` — List uploaded files
- `POST /api/process/:fileId` — Process file
- `GET /api/questions` — Get extracted questions
- `PUT /api/questions/:id` — Update question
- `DELETE /api/questions/:id` — Delete question
- `POST /api/export` — Export JSON
- `GET /api/metrics` — Dashboard metrics

### 4.2 Frontend (React + Vite)

**Dependencies:**
- react: UI framework
- react-router-dom: Routing
- axios: HTTP client
- react-dropzone: Drag & drop
- @tanstack/react-query: Data fetching
- zustand: State management
- lucide-react: Icons
- tailwindcss: Styling (via CDN for simplicity)

### 4.3 Data Storage

- Files: `./uploads/` directory
- Extracted Images: `./uploads/images/`
- Questions JSON: `./data/questions.json`
- Logs: `./logs/`

## 5. Acceptance Criteria

- [ ] User can upload PDF/image files via drag & drop
- [ ] User can assign metadata before processing
- [ ] System extracts text from native PDFs
- [ ] System performs OCR on scanned PDFs/images
- [ ] System parses questions with alternatives (A-E)
- [ ] System identifies correct answer automatically
- [ ] System validates each question
- [ ] User can edit questions inline
- [ ] User can export questions as JSON
- [ ] Dashboard shows processing metrics
- [ ] UI is dark themed with coral accents
- [ ] All interactions have loading states
- [ ] Errors are displayed via toast notifications