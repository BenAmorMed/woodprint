import multer from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

const DOSSIER_UPLOADS = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(DOSSIER_UPLOADS)) {
  fs.mkdirSync(DOSSIER_UPLOADS, { recursive: true });
}

const stockage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DOSSIER_UPLOADS);
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${extension}`);
  }
});

const filtreImage = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const typesAutorises = ['image/jpeg', 'image/png', 'image/webp'];
  if (typesAutorises.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Seules les images sont autorisées.'));
  }
};

export const uploadMiddleware = multer({
  storage: stockage,
  fileFilter: filtreImage,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});
