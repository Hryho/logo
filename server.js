const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

const ADMIN_USER = 'DJV';
const ADMIN_PASS_HASH = '9f11c940f686ec91a21a7964f37defde0312edeac9ab28b736910c6e95191ba3';
const sessions = {};

let questions = JSON.parse(fs.readFileSync('questions.json', 'utf8'));

function serveStatic(res, filepath, contentType) {
  fs.readFile(filepath, (err, data) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
}

function parseBody(req, callback) {
  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', () => {
    try {
      callback(JSON.parse(body));
    } catch (e) {
      callback(null);
    }
  });
}

function checkSession(req) {
  const cookie = req.headers.cookie || '';
  const match = cookie.match(/session=([^;]+)/);
  return match && sessions[match[1]];
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);

  if (req.method === 'GET' && parsed.pathname === '/') {
    return serveStatic(res, path.join('public', 'index.html'), 'text/html');
  }
  if (req.method === 'GET' && parsed.pathname === '/script.js') {
    return serveStatic(res, path.join('public', 'script.js'), 'application/javascript');
  }
  if (req.method === 'GET' && parsed.pathname === '/admin') {
    return serveStatic(res, path.join('public', 'admin.html'), 'text/html');
  }
  if (req.method === 'GET' && parsed.pathname === '/admin.js') {
    return serveStatic(res, path.join('public', 'admin.js'), 'application/javascript');
  }
  if (req.method === 'GET' && parsed.pathname === '/question') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(questions[0]));
  }
  if (req.method === 'POST' && parsed.pathname === '/answer') {
    return parseBody(req, body => {
      if (!body) { res.writeHead(400); return res.end(); }
      const q = questions.find(q => q.id === body.id);
      const correct = q && q.answer.toLowerCase() === String(body.answer).toLowerCase();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ correct }));
    });
  }
  if (req.method === 'POST' && parsed.pathname === '/admin/login') {
    return parseBody(req, body => {
      if (!body) { res.writeHead(400); return res.end(); }
      const hash = crypto.createHash('sha256').update(String(body.password)).digest('hex');
      if (body.username === ADMIN_USER && hash === ADMIN_PASS_HASH) {
        const token = crypto.randomBytes(16).toString('hex');
        sessions[token] = true;
        res.writeHead(200, { 'Content-Type': 'application/json', 'Set-Cookie': `session=${token}; HttpOnly` });
        res.end(JSON.stringify({ success: true }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false }));
      }
    });
  }
  if (req.method === 'GET' && parsed.pathname === '/admin/questions') {
    if (!checkSession(req)) { res.writeHead(401); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(questions));
  }
  if (req.method === 'POST' && parsed.pathname === '/admin/questions') {
    if (!checkSession(req)) { res.writeHead(401); return res.end(); }
    return parseBody(req, body => {
      if (!body || !body.question || !body.answer) { res.writeHead(400); return res.end(); }
      const newQ = { id: questions.length ? questions[questions.length - 1].id + 1 : 1, question: body.question, answer: body.answer };
      questions.push(newQ);
      fs.writeFile('questions.json', JSON.stringify(questions, null, 2), () => {});
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true }));
    });
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
