import pdfParse from 'pdf-parse';
import { recursiveChunk, enrichChunksWithMetadata } from './chunking.service.js';
import { embedAndUpsert, deleteDocumentVectors } from './embedding.service.js';
import { Document } from '../models/Document.model.js';
import { Organization } from '../models/Organization.model.js';

export async function extractText(buffer, mimeType) {
  if (mimeType === 'application/pdf') {
    const data = await pdfParse(buffer);
    return data.text;
  }
  // txt, markdown
  return buffer.toString('utf-8');
}

export async function processDocument(docRecord, buffer, orgNamespace) {
  try {
    // Extract text
    const text = await extractText(buffer, docRecord.mimeType);

    // Recursive chunking
    const chunks = await recursiveChunk(text);

    // Enrich with metadata
    const enriched = enrichChunksWithMetadata(chunks, {
      documentId: docRecord._id.toString(),
      originalName: docRecord.originalName,
      orgNamespace,
    });

    // Embed and upsert to Pinecone
    const pineconeIds = await embedAndUpsert(enriched, orgNamespace, docRecord._id);

    // Update document record
    await Document.findByIdAndUpdate(docRecord._id, {
      status: 'ready',
      chunkCount: chunks.length,
      pineconeIds,
    });

    // Update org document count
    await Organization.findByIdAndUpdate(docRecord.organizationId, {
      $inc: { documentCount: 1 },
    });
  } catch (err) {
    await Document.findByIdAndUpdate(docRecord._id, {
      status: 'error',
      errorMessage: err.message,
    });
    console.error('Document processing error:', err);
  }
}
