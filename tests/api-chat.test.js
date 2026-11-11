import { describe, it, expect } from 'vitest';
import handler, { createHandler } from '../api/chat.js';

const mkRes = () => {
  const r = { code: 0, body: undefined, headers: {} };
  r.setHeader = (k, v) => { r.headers[k] = v; };
  r.status = (c) => { r.code = c; return r; };
  r.json = (b) => { r.body = b; return r; };
  r.end = () => r;
  return r;
};
const body = (extra = {}) => ({ demo: 'restaurante', sessionId: 'abc', messages: [{ role: 'user', content: 'hola' }], context: { menu: [] }, ...extra });
const upstream = (text, ok = true, status = 200) => async () => ({ ok, status, json: async () => ({ content: [{ type: 'text', text }] }), text: async () => 'SECRETO-interno' });
const run = async (req, env, fetchImpl) => { const res = mkRes(); await createHandler({ env, fetchImpl })(req, res); return res; };
const KEY = { ANTHROPIC_API_KEY: 'test-key-fake' };

describe('api/chat', () => {
  it('export default es una función', () => { expect(typeof handler).toBe('function'); });
  it('405 con GET', async () => { expect((await run({ method: 'GET' }, KEY)).code).toBe(405); });
  it('400 con cuerpo inválido', async () => {
    const malos = [null, {}, body({ messages: [] }), body({ messages: [{ role: 'system', content: 'x' }] }), body({ messages: [{ role: 'user', content: 'a'.repeat(5000) }] }), body({ demo: 'otra' }), body({ messages: Array(40).fill({ role: 'user', content: 'x' }) })];
    for (const b of malos) expect((await run({ method: 'POST', body: b }, KEY, upstream('{}'))).code).toBe(400);
  });
  it('503 sin clave', async () => {
    const r = await run({ method: 'POST', body: body() }, {}, upstream('{}'));
    expect(r.code).toBe(503);
  });
  it('éxito: manda clave y devuelve el contrato', async () => {
    let visto;
    const texto = '```json\n{"reply":"Hola","actions":[{"type":"pasar_a_persona","payload":{}},{"type":"hack","payload":{}}],"handoff":false}\n```';
    const f = async (url, init) => { visto = { url, init }; return upstream(texto)(); };
    const r = await run({ method: 'POST', body: body() }, KEY, f);
    expect(r.code).toBe(200);
    expect(r.body).toEqual({ reply: 'Hola', actions: [{ type: 'pasar_a_persona', payload: {} }], handoff: false });
    expect(visto.url).toBe('https://api.anthropic.com/v1/messages');
    expect(visto.init.headers['x-api-key']).toBe('test-key-fake');
    const sent = JSON.parse(visto.init.body);
    expect(sent.max_tokens).toBeLessThanOrEqual(1024);
    expect(sent.system).toContain('Plato & Co.');
  });
  it('texto que no es JSON se devuelve como reply', async () => {
    const r = await run({ method: 'POST', body: body() }, KEY, upstream('Buenas tardes'));
    expect(r.body).toEqual({ reply: 'Buenas tardes', actions: [], handoff: false });
  });
  it('error upstream da 502 genérico sin filtrar detalles ni clave', async () => {
    const r = await run({ method: 'POST', body: body() }, KEY, upstream('', false, 401));
    expect(r.code).toBe(502);
    expect(JSON.stringify(r.body)).not.toMatch(/SECRETO|test-key-fake/);
  });
  it('fetch que rechaza da 502', async () => {
    const r = await run({ method: 'POST', body: body() }, KEY, async () => { throw new Error('boom test-key-fake'); });
    expect(r.code).toBe(502);
    expect(JSON.stringify(r.body)).not.toContain('boom');
  });
});
