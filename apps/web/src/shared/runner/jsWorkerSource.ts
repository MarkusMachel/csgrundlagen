/**
 * Source of the Web Worker that runs JavaScript snippets. It is plain JS (a
 * string), loaded through a Blob URL, so it runs isolated from the page: no
 * DOM, no access to the app's storage or session token, and the network APIs
 * are removed before the snippet runs.
 *
 * Protocol: the page posts the code; the worker posts
 *   { type: 'out', text }  for every console line (stdout and stderr alike)
 *   { type: 'done' }       once the code and its timers/promises have settled
 */
export const JS_WORKER_SOURCE = String.raw`
'use strict';
const realSetTimeout = self.setTimeout.bind(self);
const realClearTimeout = self.clearTimeout.bind(self);
const realSetInterval = self.setInterval.bind(self);
const realClearInterval = self.clearInterval.bind(self);
const post = self.postMessage.bind(self);

for (const name of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches']) {
  try { Object.defineProperty(self, name, { value: undefined }); } catch (e) {}
}

// Node-style formatting, so expected outputs read like a real terminal.
function fmt(v, depth) {
  const nested = depth > 0;
  if (typeof v === 'string') return nested ? "'" + v + "'" : v;
  if (typeof v === 'bigint') return v + 'n';
  if (typeof v === 'symbol') return v.toString();
  if (typeof v === 'function') return '[' + (/^class\b/.test(Function.prototype.toString.call(v)) ? 'class' : 'Function') + ': ' + (v.name || '(anonymous)') + ']';
  if (v === null || typeof v !== 'object') return String(v);
  if (depth > 2) return Array.isArray(v) ? '[Array]' : '[Object]';
  if (v instanceof Error) return v.stack && !nested ? v.name + ': ' + v.message : '[' + v.name + ': ' + v.message + ']';
  if (Array.isArray(v)) return v.length ? '[ ' + v.map((x) => fmt(x, depth + 1)).join(', ') + ' ]' : '[]';
  if (v instanceof Map) return 'Map(' + v.size + ') {' + (v.size ? ' ' + [...v].map(([k, x]) => fmt(k, depth + 1) + ' => ' + fmt(x, depth + 1)).join(', ') + ' ' : '') + '}';
  if (v instanceof Set) return 'Set(' + v.size + ') {' + (v.size ? ' ' + [...v].map((x) => fmt(x, depth + 1)).join(', ') + ' ' : '') + '}';
  if (v instanceof Promise) return 'Promise { <pending> }';
  if (v instanceof Date) return v.toISOString();
  const keys = Object.keys(v);
  const name = v.constructor && v.constructor !== Object && v.constructor.name ? v.constructor.name + ' ' : '';
  return keys.length ? name + '{ ' + keys.map((k) => k + ': ' + fmt(v[k], depth + 1)).join(', ') + ' }' : name + '{}';
}
const line = (...args) => post({ type: 'out', text: args.map((a) => fmt(a, 0)).join(' ') });
self.console = { log: line, info: line, debug: line, warn: line, error: line, table: line, dir: line };

// Track timers so we know when the program has finished.
let pending = 0;
const live = new Set();
self.setTimeout = (fn, ms, ...args) => {
  pending++;
  const id = realSetTimeout(() => { if (live.delete(id)) pending--; run(() => fn(...args)); }, ms);
  live.add(id);
  return id;
};
self.clearTimeout = (id) => { if (live.delete(id)) pending--; realClearTimeout(id); };
self.setInterval = (fn, ms, ...args) => { pending++; const id = realSetInterval(() => run(() => fn(...args)), ms); live.add(id); return id; };
self.clearInterval = (id) => { if (live.delete(id)) pending--; realClearInterval(id); };

function run(fn) {
  try { fn(); } catch (e) { line('Uncaught ' + fmt(e, 0)); }
}
self.addEventListener('unhandledrejection', (e) => { e.preventDefault(); line('Uncaught (in promise) ' + fmt(e.reason, 0)); });

const tick = () => new Promise((r) => realSetTimeout(r, 0));
self.onmessage = async (e) => {
  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    await new AsyncFunction(e.data)();
  } catch (err) {
    line('Uncaught ' + fmt(err, 0));
  }
  // Settle: wait for timers, then a few turns for promise chains and rejections.
  do { await tick(); } while (pending > 0);
  await tick(); await tick();
  post({ type: 'done' });
};
`;
