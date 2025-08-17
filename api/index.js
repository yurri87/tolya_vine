// api/index.js

// Эти заголовки нужны, чтобы наш React-сайт (с одного адреса)
// мог безопасно общаться с API (с другого адреса)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// Обработчик для "предварительных" запросов, которые браузеры отправляют для проверки безопасности
function handleOptions(request) {
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

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Сначала обрабатываем OPTIONS-запрос
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Простой роутер, который определяет, что делать в зависимости от адреса и метода запроса
    if (path === '/api/bottles') {
      switch (request.method) {
        case 'GET':
          return getBottles(env);
        case 'POST':
          return saveBottle(request, env);
        case 'PUT':
          return saveBottle(request, env);
        case 'DELETE':
          return deleteBottle(request, env);
        default:
          return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
      }
    }

    return new Response('Not Found', { status: 404 });
  },
};

// --- Обработчики запросов ---

async function getBottles(env) {
  // Получаем все данные из хранилища по ключу 'bottles_data'
  const data = await env.VINE_KV.get('bottles_data');
  if (data === null) {
    // Если данных нет, возвращаем пустой массив
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

    // Получаем текущий список бутылей
    const bottles = await env.VINE_KV.get('bottles_data', { type: 'json' }) || [];

    // Ищем, есть ли уже бутыль с таким ID
    const bottleIndex = bottles.findIndex(b => b.id === newBottleData.id);

    if (bottleIndex > -1) {
      // Если есть - обновляем
      bottles[bottleIndex] = newBottleData;
    } else {
      // Если нет - добавляем
      bottles.push(newBottleData);
    }

    // Сохраняем обновленный список обратно в хранилище
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
    
    // Фильтруем массив, удаляя бутыль с нужным ID
    bottles = bottles.filter(b => b.id !== id);

    // Сохраняем обновленный список
    await env.VINE_KV.put('bottles_data', JSON.stringify(bottles));

    return new Response('Bottle deleted', { status: 200, headers: corsHeaders });

  } catch (e) {
    return new Response(e.message, { status: 500, headers: corsHeaders });
  }
}
