import { Document } from '../models/Document.model.js';
import { processDocument } from '../services/document.service.js';
import { deleteDocumentVectors } from '../services/embedding.service.js';

export async function uploadDocument(req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const doc = await Document.create({
    name: req.file.originalname,
    originalName: req.file.originalname,
    mimeType: req.file.mimetype,
    size: req.file.size,
    organizationId: req.user.organizationId._id,
    uploadedBy: req.user._id,
    status: 'processing',
  });

  // Process asynchronously — don't block the response
  processDocument(doc, req.file.buffer, req.orgNamespace).catch(console.error);

  res.status(202).json({
    message: 'Document uploaded and processing started',
    document: {
      id: doc._id,
      name: doc.originalName,
      status: doc.status,
    },
  });
}

export async function getDocuments(req, res) {
  const docs = await Document.find({ organizationId: req.user.organizationId._id })
    .populate('uploadedBy', 'name email')
    .sort({ createdAt: -1 });
  res.json({ documents: docs });
}

export async function getDocumentById(req, res) {
  const doc = await Document.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId._id,
  }).populate('uploadedBy', 'name email');

  if (!doc) return res.status(404).json({ error: 'Document not found' });
  res.json({ document: doc });
}

export async function deleteDocument(req, res) {
  const doc = await Document.findOne({
    _id: req.params.id,
    organizationId: req.user.organizationId._id,
  });

  if (!doc) return res.status(404).json({ error: 'Document not found' });

  // Remove from Pinecone
  await deleteDocumentVectors(doc.pineconeIds || [], req.orgNamespace);

  await doc.deleteOne();
  res.json({ message: 'Document deleted successfully' });
}
