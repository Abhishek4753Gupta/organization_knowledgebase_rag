import { Pinecone } from '@pinecone-database/pinecone';

let pinecone = null;

export async function initPinecone() {
  pinecone = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY,
  });
  console.log('✅ Pinecone initialized');
  return pinecone;
}

export function getPinecone() {
  if (!pinecone) throw new Error('Pinecone not initialized');
  return pinecone;
}

export function getIndex() {
  return getPinecone().Index(process.env.PINECONE_INDEX);
}
