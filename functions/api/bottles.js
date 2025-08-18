const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function handleOptions(request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, {
      headers: corsHeaders,
    });
  }
  return new Response(null, {
    headers: {
      Allow: 'GET, POST, PUT, DELETE, OPTIONS',
    },
  });
}

async function handleRequest(request, env) {
  switch (request.method) {
    case 'GET':
      return getBottles(env);
    case 'POST':
    case 'PUT':
      return saveBottle(request, env);
    case 'DELETE':
      return deleteBottle(request, env);
    default:
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
  }
}

export async function onRequest(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }

  return handleRequest(request, env);
}

// --- Helper Functions ---

async function getBottles(env) {
  const data = await env.VINE_KV.get('bottles_data');
  if (data === null) {
    return new Response(JSON.stringify([]), { 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
  return new Response(data, { 
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
}

async function saveBottle(request, env) {
  try {
    const newBottleData = await request.json();
    if (!newBottleData.id) {
      return new Response('Missing bottle ID', { status: 400, headers: corsHeaders });
    }
    const bottles = await env.VINE_KV.get('bottles_data', { type: 'json' }) || [];
    const bottleIndex = bottles.findIndex(b => b.id === newBottleData.id);
    if (bottleIndex > -1) {
      bottles[bottleIndex] = newBottleData;
    } else {
      bottles.push(newBottleData);
    }
    await env.VINE_KV.put('bottles_data', JSON.stringify(bottles));
    return new Response(JSON.stringify(newBottleData), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}

async function deleteBottle(request, env) {
  try {
    const { id } = await request.json();
    if (!id) {
      return new Response('Missing bottle ID', { status: 400, headers: corsHeaders });
    }
    let bottles = await env.VINE_KV.get('bottles_data', { type: 'json' }) || [];
    bottles = bottles.filter(b => b.id !== id);
    await env.VINE_KV.put('bottles_data', JSON.stringify(bottles));
    return new Response('Bottle deleted', { status: 200, headers: corsHeaders });
  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}
