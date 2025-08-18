import { kv } from '@vercel/kv';

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
