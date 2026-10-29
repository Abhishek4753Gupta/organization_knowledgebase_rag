import { Router } from 'express';
import {
  uploadDocument,
  getDocuments,
  getDocumentById,
  deleteDocument,
} from '../controllers/document.controller.js';
import { authenticate, requireAdmin } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/upload.middleware.js';

const router = Router();

// All authenticated users can list documents
router.get('/', authenticate, getDocuments);
router.get('/:id', authenticate, getDocumentById);

// Only admins can upload/delete
router.post('/', authenticate, requireAdmin, upload.single('file'), uploadDocument);
router.delete('/:id', authenticate, requireAdmin, deleteDocument);

export default router;
