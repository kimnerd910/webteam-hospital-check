import { list, put } from '@vercel/blob';

const PATHNAME = 'webteam-hospital-labels.json';
const LABEL_IDS = new Set(['maintenance', 'webonly', 'unknown', 'transfer', 'nonproduction']);

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const result = await list({ prefix: PATHNAME, limit: 1 });
      const blob = result.blobs.find(item => item.pathname === PATHNAME);
      if (!blob) return res.status(200).json({ labels: {} });
      const response = await fetch(blob.url, { cache: 'no-store' });
      if (!response.ok) throw new Error('Unable to read state');
      return res.status(200).json(await response.json());
    } catch (error) {
      return res.status(200).json({ labels: {} });
    }
  }

  if (req.method === 'POST') {
    const input = req.body?.labels;
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return res.status(400).json({ error: 'Invalid labels' });
    }

    const labels = {};
    for (const [name, label] of Object.entries(input)) {
      if (typeof name === 'string' && name.length <= 100 && LABEL_IDS.has(label)) labels[name] = label;
    }

    await put(PATHNAME, JSON.stringify({ labels, updatedAt: new Date().toISOString() }), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json',
      cacheControlMaxAge: 0
    });
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
