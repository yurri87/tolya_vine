import { kv } from '@vercel/kv';

// One-off migration: copy `notes` -> `description` when description is missing, then remove `notes`.
// Invoke with GET or POST. Example: GET /api/migrate-notes
export default async function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'POST') {
    response.setHeader('Allow', ['GET', 'POST']);
    return response.status(405).end(`Method ${request.method} Not Allowed`);
  }

  try {
    const bottlesObject = await kv.hgetall('bottles');
    const entries = bottlesObject ? Object.entries(bottlesObject) : [];

    let scanned = 0;
    let updated = 0;

    for (const [id, bottle] of entries) {
      scanned++;
      if (!bottle || typeof bottle !== 'object') continue;

      const hasNotes = typeof bottle.notes === 'string' && bottle.notes.trim() !== '';
      const hasDescription = typeof bottle.description === 'string' && bottle.description.trim() !== '';

      if (hasNotes || ('notes' in bottle)) {
        const next = { ...bottle };

        // If description is empty and notes present, copy
        if (!hasDescription && hasNotes) {
          next.description = bottle.notes;
        }

        // Remove legacy notes field
        if ('notes' in next) delete next.notes;

        await kv.hset('bottles', { [id]: next });
        updated++;
      }
    }

    return response.status(200).json({ scanned, updated });
  } catch (error) {
    return response.status(500).json({ error: error.message });
  }
}
