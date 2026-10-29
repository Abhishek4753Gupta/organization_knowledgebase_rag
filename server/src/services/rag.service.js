import { getEmbeddings, getLLM } from '../config/gemini.js';
import { getIndex } from '../config/pinecone.js';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

const TOP_K = 5;
const NUM_QUERY_VARIANTS = 3;

// ─── SYSTEM PROMPT ────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are an intelligent assistant for an organization's knowledge base.
You MUST follow these grounded constraints strictly:

1. ONLY answer based on the provided context documents. Never use external knowledge.
2. If the answer is not found in the context, respond: "I don't have information about that in the provided documents."
3. Always cite which document/section supports your answer using [Source: <documentName>, Chunk <chunkIndex>].
4. Do not fabricate facts, numbers, or details.
5. Be concise and accurate. Format your answer clearly.
6. If the question is ambiguous, ask for clarification.

Context Documents:
{context}

Answer the user's question based ONLY on the above context.`;

// ─── RAG FUSION: Generate query variations ────────────────────────────────────
async function generateQueryVariants(originalQuery) {
  const llm = getLLM();
  const prompt = `Generate ${NUM_QUERY_VARIANTS} different phrasings of the following question to improve document retrieval. 
Return ONLY the rephrased questions, one per line, without numbering or extra text.

Original question: ${originalQuery}`;

  const response = await llm.invoke([new HumanMessage(prompt)]);
  const variants = response.content
    .split('\n')
    .map((q) => q.trim())
    .filter((q) => q.length > 0)
    .slice(0, NUM_QUERY_VARIANTS);
    //console.log(variants);
  return [originalQuery, ...variants];
}

// ─── Retrieve docs for a single query ─────────────────────────────────────────
async function retrieveForQuery(query, orgNamespace) {
  const embeddings = getEmbeddings();
  const index = getIndex();
  const namespacedIndex = index.namespace(orgNamespace);

  const queryEmbedding = await embeddings.embedQuery(query);
  const results = await namespacedIndex.query({
    vector: queryEmbedding,
    topK: TOP_K,
    includeMetadata: true,
    filter: { orgNamespace: { $eq: orgNamespace } }, // Grounded constraint: org isolation
  });

  return results.matches || [];
}

// ─── Reciprocal Rank Fusion ────────────────────────────────────────────────────
function reciprocalRankFusion(multiQueryResults, k = 60) {
  const scores = new Map();
  const docMap = new Map();

  for (const results of multiQueryResults) {
    results.forEach((match, rank) => {
      const id = match.id;
      const currentScore = scores.get(id) || 0;
      scores.set(id, currentScore + 1 / (k + rank + 1));
      docMap.set(id, match);
    });
  }

  // Sort by RRF score descending
  return [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .slice(0, TOP_K)
    .map(([id, score]) => ({ ...docMap.get(id), rrfScore: score }));
}

// ─── Main RAG pipeline ────────────────────────────────────────────────────────
export async function ragQuery(userQuery, orgNamespace) {
  // Step 1: Generate query variants (RAG Fusion)
  const queryVariants = await generateQueryVariants(userQuery);

  // Step 2: Retrieve docs for each variant in parallel
  const multiQueryResults = await Promise.all(
    queryVariants.map((q) => retrieveForQuery(q, orgNamespace))
  );

  // Step 3: Apply Reciprocal Rank Fusion
  const fusedResults = reciprocalRankFusion(multiQueryResults);

  if (fusedResults.length === 0) {
    return {
      answer: "I don't have any relevant information in the knowledge base to answer your question.",
      sources: [],
      queryVariants,
    };
  }

  // Step 4: Build grounded context
  const context = fusedResults
    .map((match, i) => {
      const meta = match.metadata || {};
      return `[Doc ${i + 1}] File: ${meta.originalName || 'Unknown'}, Chunk ${meta.chunkIndex ?? i}\n${meta.text || ''}`;
    })
    .join('\n\n---\n\n');

  // Step 5: Generate answer with grounded constraints
  const llm = getLLM();
  const systemMsg = new SystemMessage(SYSTEM_PROMPT.replace('{context}', context));
  const humanMsg = new HumanMessage(userQuery);

  const response = await llm.invoke([systemMsg, humanMsg]);

  return {
    answer: response.content,
    sources: fusedResults.map((m) => ({
      documentId: m.metadata?.documentId,
      documentName: m.metadata?.originalName,
      chunkIndex: m.metadata?.chunkIndex,
      score: m.rrfScore,
      preview: m.metadata?.text?.slice(0, 200),
    })),
    queryVariants,
  };
}
