const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Если файла data.json ещё нет — создаём пустой массив
if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const server = http.createServer((req, res) => {
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
  // === Обработка отправки формы (POST) ===
if (pathname === '/submit' && method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
        try {
            // Парсим JSON данные
            const data = JSON.parse(body);
            const message = {
                name:    data.name    || '',
                email:   data.email   || '',
                comment: data.comment || '',
                date:    new Date().toLocaleString('ru-RU')
            };

            // Читаем существующие данные, добавляем новое сообщение, сохраняем
            const messages = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
            messages.push(message);
            fs.writeFileSync(DATA_FILE, JSON.stringify(messages, null, 2));

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
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(data);
    return;
  }

  // === 404 ===
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Страница не найдена');
});

server.listen(PORT, () => {
  console.log(`Сервер запущен: http://localhost:${PORT}`);
});