import { getEmbeddings } from '../config/gemini.js';
import { getIndex } from '../config/pinecone.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Embed and upsert document chunks into Pinecone under the org namespace
 */
export async function embedAndUpsert(enrichedChunks, orgNamespace, documentId) {
  const embeddings = getEmbeddings();
  const index = getIndex();
  const namespacedIndex = index.namespace(orgNamespace);

  const batchSize = 100;
  const vectors = [];

  for (const chunk of enrichedChunks) {
    const embedding = await embeddings.embedQuery(chunk.content);
    vectors.push({
      id: uuidv4(),
      values: embedding,
      metadata: {
        ...chunk.metadata,
        documentId: documentId.toString(),
        orgNamespace,
        text: chunk.content,
      },
    });
  }

  // Upsert in batches
  for (let i = 0; i < vectors.length; i += batchSize) {
    await namespacedIndex.upsert(vectors.slice(i, i + batchSize));
  }

  return vectors.map((v) => v.id);
}

/**
 * Delete all vectors for a document from Pinecone
 */
export async function deleteDocumentVectors(pineconeIds, orgNamespace) {
  const index = getIndex();
  const namespacedIndex = index.namespace(orgNamespace);
  if (pineconeIds.length > 0) {
    await namespacedIndex.deleteMany(pineconeIds);
  }
}
