import { kv } from '@vercel/kv';

export default async function handler(request, response) {
  const { method } = request;

  switch (method) {
    case 'GET':
      try {
        const bottles = await kv.hgetall('bottles');
        return response.status(200).json(bottles || {});
      } catch (error) {
        return response.status(500).json({ error: error.message });
      }

    case 'POST':
      try {
        const bottle = request.body; // FIX: Use request.body instead of request.json()
        if (!bottle || !bottle.id) {
          return response.status(400).json({ error: 'Bottle data and ID are required' });
        }
        await kv.hset('bottles', { [bottle.id]: bottle });
        return response.status(201).json(bottle);
      } catch (error) {
        return response.status(500).json({ error: error.message });
      }

    case 'PUT':
      try {
        const bottle = request.body; // FIX: Use request.body instead of request.json()
        if (!bottle || !bottle.id) {
          return response.status(400).json({ error: 'Bottle data and ID are required' });
        }
        await kv.hset('bottles', { [bottle.id]: bottle });
        return response.status(200).json(bottle);
      } catch (error) {
        return response.status(500).json({ error: error.message });
      }

    case 'DELETE':
      try {
        const { id } = request.query;
        if (!id) {
          return response.status(400).json({ error: 'Bottle ID is required' });
        }
        await kv.hdel('bottles', id);
        return response.status(204).send(null);
      } catch (error) {
        return response.status(500).json({ error: error.message });
      }

    default:
      response.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      return response.status(405).end(`Method ${method} Not Allowed`);
  }
}


// Vercel handles CORS and OPTIONS requests automatically for Hobby accounts.
// We only need to handle the main logic.

export default async function handler(request) {
  const { method } = request;

  try {
    switch (method) {
      case 'GET': {
        const bottles = await kv.get('bottles_data');
        return new Response(JSON.stringify(bottles || []),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      case 'POST':
      case 'PUT': {
        const newBottleData = await request.json();
        if (!newBottleData.id) {
          return new Response('Missing bottle ID', { status: 400 });
        }
        const bottles = await kv.get('bottles_data') || [];
        const bottleIndex = bottles.findIndex(b => b.id === newBottleData.id);
        if (bottleIndex > -1) {
          bottles[bottleIndex] = newBottleData; // Update existing
        } else {
          bottles.push(newBottleData); // Add new
        }
        await kv.set('bottles_data', bottles);
        return new Response(JSON.stringify(newBottleData),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      case 'DELETE': {
        const { id } = await request.json();
        if (!id) {
          return new Response('Missing bottle ID', { status: 400 });
        }
        let bottles = await kv.get('bottles_data') || [];
        bottles = bottles.filter(b => b.id !== id);
        await kv.set('bottles_data', bottles);
        return new Response('Bottle deleted', { status: 200 });
      }

      default:
        return new Response('Method Not Allowed', { status: 405 });
    }
  } catch (error) {
    console.error(error);
    return new Response(error.message, { status: 500 });
  }
}
