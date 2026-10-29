import { ragQuery } from '../services/rag.service.js';

export async function chat(req, res) {
  const { query } = req.body;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({ error: 'Query is required' });
  }

  const result = await ragQuery(query.trim(), req.orgNamespace);
  res.json(result);
}
