import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';

/**
 * Recursively chunk text into overlapping segments.
 * Uses multiple separators to respect semantic boundaries:
 * paragraphs > sentences > words > characters
 */
export async function recursiveChunk(text, options = {}) {
  const {
    chunkSize = 1000,
    chunkOverlap = 200,
    separators = ['\n\n', '\n', '. ', '? ', '! ', ' ', ''],
  } = options;

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
    separators,
  });

  const docs = await splitter.createDocuments([text]);
  return docs.map((doc) => doc.pageContent);
}

/**
 * Add positional metadata to chunks for better citation tracking
 */
export function enrichChunksWithMetadata(chunks, baseMetadata = {}) {
  return chunks.map((content, index) => ({
    content,
    metadata: {
      ...baseMetadata,
      chunkIndex: index,
      totalChunks: chunks.length,
      charCount: content.length,
    },
  }));
}
