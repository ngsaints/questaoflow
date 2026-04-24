import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }
});

let files = [];

const getFiles = () => {
  const filesPath = path.join(__dirname, '../../data/files.json');
  if (fs.existsSync(filesPath)) {
    return JSON.parse(fs.readFileSync(filesPath, 'utf8'));
  }
  return [];
};

const saveFiles = (data) => {
  const filesPath = path.join(__dirname, '../../data/files.json');
  fs.writeFileSync(filesPath, JSON.stringify(data, null, 2));
};

router.post('/', upload.array('files', 10), (req, res) => {
  try {
    const uploadedFiles = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimeType: file.mimetype,
      status: 'pending',
      uploadedAt: new Date().toISOString(),
      metadata: null
    }));

    files = [...getFiles(), ...uploadedFiles];
    saveFiles(files);

    res.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', (req, res) => {
  files = getFiles();
  res.json({ files });
});

router.delete('/:id', (req, res) => {
  try {
    files = getFiles();
    const fileIndex = files.findIndex(f => f.id === req.params.id);

    if (fileIndex === -1) {
      return res.status(404).json({ error: 'File not found' });
    }

    const file = files[fileIndex];
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }

    files.splice(fileIndex, 1);
    saveFiles(files);

    res.json({ success: true, message: 'File deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
