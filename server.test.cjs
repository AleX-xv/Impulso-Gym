'use strict';

const assert = require('node:assert/strict');
const { once } = require('node:events');
const { resolve } = require('node:path');
const { Writable } = require('node:stream');
const { after, before, test } = require('node:test');

const releasePath = process.env.IMPULSO_TEST_ROOT || __dirname;
const { server } = require(resolve(releasePath, 'server.cjs'));
const direct = process.env.IMPULSO_TEST_TRANSPORT === 'direct';
let url;

before(async () => {
  if (direct) return;
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  url = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (direct) return;
  await new Promise((done, reject) => server.close(error => error ? reject(error) : done()));
});

async function request(path, method = 'GET') {
  if (!direct) return fetch(`${url}${path}`, { method });

  const chunks = [];
  const output = new Writable({
    write(chunk, encoding, done) {
      chunks.push(chunk);
      done();
    }
  });
  output.setHeader = () => {};
  output.writeHead = (status, headers) => {
    output.status = status;
    output.headers = new Headers(headers);
  };
  const finished = once(output, 'finish');
  server.emit('request', { url: path, method }, output);
  await finished;
  return { status: output.status, headers: output.headers, text: async () => Buffer.concat(chunks).toString('utf8') };
}

test('CA-01: el panel y sus recursos públicos se sirven correctamente', async () => {
  const page = await request('/');
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.match(await page.text(), /id="history-list"/);
  for (const [path, type] of [
    ['/app.js', 'text/javascript'], ['/styles.css', 'text/css'],
    ['/ideas.html', 'text/html'], ['/ideas.js', 'text/javascript'],
    ['/ideas-data.js', 'text/javascript'], ['/ideas.css', 'text/css']
  ]) {
    const asset = await request(path);
    assert.equal(asset.status, 200, path);
    assert.equal(asset.headers.get('content-type'), `${type}; charset=utf-8`, path);
    assert.ok((await asset.text()).length > 0, path);
  }
});

test('CA-02: una ruta inexistente devuelve 404', async () => {
  const response = await request('/ruta-inexistente');
  assert.equal(response.status, 404);
  assert.equal(await response.text(), 'Página no encontrada');
});

test('CA-03: healthz confirma disponibilidad con HTTP 200', async () => {
  const response = await request('/healthz');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'OK');
  const head = await request('/healthz', 'HEAD');
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
});
