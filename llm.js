// Adapter: lets the app (written against Anthropic's Messages format) run on any OpenAI-compatible
// chat API, e.g. Google Gemini's free tier, Groq or OpenRouter. Request and response are translated.
function toOpenAI(body, model) {
  const msgs = [];
  if (body.system) msgs.push({ role: 'system', content: String(body.system) });
  for (const m of body.messages || []) {
    if (typeof m.content === 'string') { msgs.push({ role: m.role, content: m.content }); continue; }
    const blocks = Array.isArray(m.content) ? m.content : [];
    if (m.role === 'assistant') {
      const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('');
      const calls = blocks.filter(b => b.type === 'tool_use').map(b => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input || {}) } }));
      msgs.push({ role: 'assistant', content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
    } else {
      for (const b of blocks) if (b.type === 'tool_result') msgs.push({ role: 'tool', tool_call_id: b.tool_use_id, content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content) });
      const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('');
      if (text) msgs.push({ role: 'user', content: text });
    }
  }
  const out = { model, messages: msgs, max_tokens: body.max_tokens || 1200 };
  if (body.tools && body.tools.length) out.tools = body.tools.map(t => ({ type: 'function', function: { name: t.name, description: t.description || '', parameters: t.input_schema || { type: 'object', properties: {} } } }));
  return out;
}

function fromOpenAI(j) {
  const msg = j && j.choices && j.choices[0] && j.choices[0].message;
  if (!msg) throw new Error('AI returned no message');
  const content = [];
  if (msg.content) content.push({ type: 'text', text: String(msg.content) });
  for (const c of msg.tool_calls || []) {
    let input = {}; try { input = JSON.parse((c.function && c.function.arguments) || '{}'); } catch {}
    content.push({ type: 'tool_use', id: c.id || ('call_' + Math.random().toString(36).slice(2, 10)), name: c.function && c.function.name, input });
  }
  return { content, stop_reason: (msg.tool_calls || []).length ? 'tool_use' : 'end_turn' };
}

async function callCompat({ base, key, model, body, timeoutMs = 80000 }) {
  const payload = toOpenAI(body, model);
  // Gemini's "latest" models think at length by default, which can exceed the timeout; keep thinking short (override with GEMINI_REASONING=low|medium|high|none).
  if (/generativelanguage\.googleapis\.com/.test(base)) payload.reasoning_effort = process.env.GEMINI_REASONING || 'low';
  const r = await fetch(base.replace(/\/+$/, '') + '/chat/completions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + key },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(timeoutMs),
  });
  if (!r.ok) { const e = new Error('AI HTTP ' + r.status + ' ' + (await r.text()).slice(0, 200)); e.httpStatus = r.status; throw e; }
  return fromOpenAI(await r.json());
}

module.exports = { toOpenAI, fromOpenAI, callCompat };
