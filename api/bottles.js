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
        const bottle = request.body;
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
        const bottle = request.body;
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
