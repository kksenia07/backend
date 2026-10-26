const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { Pool } = require('pg');

const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost')
    ? { rejectUnauthorized: false }
    : false
});

// создаём таблицу, если её ещё нет
pool.query(`
  CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    name TEXT,
    email TEXT,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW()
  )
`).catch(err => console.error('Ошибка создания таблицы:', err));

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // === Отдача HTML файлов ===
  if (pathname === '/' || pathname === '/index2.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'index2.html')).pipe(res);
    return;
  }

  if (pathname === '/backform.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    fs.createReadStream(path.join(__dirname, 'backform.html')).pipe(res);
    return;
  }

  // === Обработка отправки формы (POST) ===
  if (pathname === '/submit' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        // Парсим JSON данные
        const data = JSON.parse(body);
        const message = {
          name:    data.name    || '',
          email:   data.email   || '',
          comment: data.comment || ''
        };

        // Сохраняем сообщение в базу данных
        await pool.query(
          'INSERT INTO messages (name, email, comment) VALUES ($1, $2, $3)',
          [message.name, message.email, message.comment]
        );

        // Отправляем JSON ответ
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ success: true, message: 'Сообщение сохранено' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // === API: получить все сообщения (для backform.html через fetch) ===
  if (pathname === '/api/messages' && method === 'GET') {
    try {
      const result = await pool.query('SELECT * FROM messages ORDER BY id ASC');
      const messages = result.rows.map(r => ({
        name: r.name,
        email: r.email,
        comment: r.comment,
        date: new Date(r.created_at).toLocaleString('ru-RU')
      }));
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(messages));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // === 404 ===
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Страница не найдена');
});

server.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});
