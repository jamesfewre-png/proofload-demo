'use strict';
/* Proofload core: constants, storage, state, helpers. No network calls anywhere in this app. */

const APP = { name: 'Proofload', version: '0.2.0' };

const TAGS = {
  red:    { name: 'Red',    hex: '#D7332A', on: '#FFFFFF' },
  green:  { name: 'Green',  hex: '#1F9D55', on: '#FFFFFF' },
  blue:   { name: 'Blue',   hex: '#1D6AE5', on: '#FFFFFF' },
  yellow: { name: 'Yellow', hex: '#F4B800', on: '#17212B' },
  orange: { name: 'Orange', hex: '#EC6A12', on: '#FFFFFF' },
  purple: { name: 'Purple', hex: '#7B46C9', on: '#FFFFFF' },
  white:  { name: 'White',  hex: '#FFFFFF', on: '#17212B' }
};
const QUARTERS = ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'];

/* Standard references and intervals are starting defaults only.
   They are editable in Settings and must be confirmed against the current
   standard and the site procedure by a competent person. */
const TYPES = [
  { id: 'chain', name: 'Chain sling', std: 'AS 3775.2', months: 12, wll: true, hint: '2-leg, 10 mm, 3 m',
    defects: ['Stretched or elongated links', 'Bent or twisted links', 'Nicks or gouges', 'Wear beyond limit', 'Corrosion', 'Heat damage', 'Hook throat opened', 'Safety latch missing or damaged', 'Tag missing or illegible'] },
  { id: 'wire', name: 'Wire rope sling', std: 'AS 1666.2', months: 12, wll: true, hint: '16 mm, 4 m, soft eyes',
    defects: ['Broken wires', 'Kinks', 'Birdcaging', 'Crushing or flattening', 'Corrosion', 'Ferrule damage', 'Thimble damage', 'Tag missing or illegible'] },
  { id: 'web', name: 'Flat webbing sling', std: 'AS 1353.2', months: 3, wll: true, hint: '50 mm, 2 m',
    defects: ['Cuts or tears', 'Abrasion', 'Chemical damage', 'Heat or friction damage', 'Stitching damaged', 'UV degradation', 'Label missing or illegible'] },
  { id: 'round', name: 'Round sling', std: 'AS 4497', months: 3, wll: true, hint: 'Endless, 2 m',
    defects: ['Cover cut, core exposed', 'Abrasion', 'Chemical damage', 'Heat damage', 'Knots', 'Label missing or illegible'] },
  { id: 'shackle', name: 'Shackle', std: 'AS 2741', months: 12, wll: true, hint: 'Bow, 19 mm pin',
    defects: ['Pin bent', 'Thread damage', 'Wrong pin fitted', 'Wear in crown or pin', 'Deformation', 'Cracks', 'Markings illegible'] },
  { id: 'hoist', name: 'Chain block or lever hoist', std: 'AS 1418.2', months: 12, wll: true, hint: 'Chain block, 3 m lift',
    defects: ['Load chain wear', 'Hook deformation', 'Safety latch missing', 'Brake slipping', 'Casing damage', 'Chain not running freely', 'No data plate'] },
  { id: 'clamp', name: 'Beam clamp or trolley', std: 'AS 4991', months: 12, wll: true, hint: '75 to 230 mm flange',
    defects: ['Jaw wear', 'Screw thread damage', 'Deformation', 'Cracks', 'Markings illegible'] },
  { id: 'eyebolt', name: 'Eyebolt or lifting point', std: 'AS 2317', months: 12, wll: true, hint: 'M20 collared',
    defects: ['Thread damage', 'Bent shank', 'Eye deformation', 'Corrosion', 'Markings illegible'] },
  { id: 'beam', name: 'Spreader or lifting beam', std: 'AS 4991', months: 12, wll: true, hint: '3 m, 2 lugs',
    defects: ['Weld cracks', 'Deformation', 'Lug wear', 'Corrosion', 'Data plate missing'] },
  { id: 'hook', name: 'Hook or master link', std: 'AS 3776', months: 12, wll: true, hint: 'Sling hook with latch',
    defects: ['Throat opening increased', 'Twist', 'Wear', 'Cracks', 'Safety latch missing or damaged'] },
  { id: 'harness', name: 'Safety harness', std: 'AS/NZS 1891.4', months: 6, wll: false, hint: 'Full body, size M-L',
    defects: ['Webbing cuts or fraying', 'Stitching damaged', 'Buckle or D-ring damage', 'Fall indicator deployed', 'Chemical or UV damage', 'Label missing or illegible'] },
  { id: 'lanyard', name: 'Lanyard or inertia reel', std: 'AS/NZS 1891.4', months: 6, wll: false, hint: 'Twin-tail, 2 m',
    defects: ['Webbing or rope damage', 'Shock absorber deployed', 'Hook gate faulty', 'Housing damage', 'Does not lock or retract', 'Label missing or illegible'] },
  { id: 'other', name: 'Other lifting gear', std: '', months: 12, wll: true, hint: 'Describe the item',
    defects: ['Deformation', 'Wear', 'Corrosion', 'Cracks', 'Markings illegible'] }
];

const RESULTS = {
  pass:    { label: 'Pass',          long: 'Fit for service' },
  fail:    { label: 'Fail',          long: 'Remove from service' },
  repair:  { label: 'Repair',        long: 'Repair, then re-inspect' },
  missing: { label: 'Not presented', long: 'Not sighted this visit' }
};

const DEFAULT_DISCLAIMER = 'This report records a visual inspection of the listed items on the date shown, carried out by the named inspector. It reflects the condition of each item at the time of inspection only. Items must be checked by the user before each use. Results and next inspection dates are the judgement of the inspector.';

/* ---------- small helpers ---------- */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const toISO = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const todayISO = () => toISO(new Date());
const parseISO = s => { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); };
const addMonths = (iso, n) => {
  const d = parseISO(iso), day = d.getDate();
  d.setDate(1); d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return toISO(d);
};
const addDays = (iso, n) => { const d = parseISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
const daysFromToday = iso => Math.round((parseISO(iso) - parseISO(todayISO())) / 864e5);
const fmtDate = iso => { if (!iso) return ''; const d = parseISO(iso); return d.getDate() + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear(); };
const fmtLong = iso => { const d = parseISO(iso); return DAY[d.getDay()] + ' ' + d.getDate() + ' ' + MON[d.getMonth()]; };
const plural = (n, one, many) => n + ' ' + (n === 1 ? one : (many || one + 's'));

/* ---------- storage: IndexedDB, with an in-memory fallback ---------- */
const DB = {
  _db: null,
  mem: { kv: new Map(), photos: new Map(), audio: new Map() },
  open() {
    return new Promise(res => {
      try {
        const r = indexedDB.open('proofload', 2);
        r.onupgradeneeded = () => { const d = r.result; ['kv', 'photos', 'audio'].forEach(n => { if (!d.objectStoreNames.contains(n)) d.createObjectStore(n); }); };
        r.onsuccess = () => { this._db = r.result; res(true); };
        r.onerror = () => res(false);
        r.onblocked = () => res(false);
      } catch (e) { res(false); }
    });
  },
  _req(store, mode, fn) {
    return new Promise((res, rej) => {
      const r = fn(this._db.transaction(store, mode).objectStore(store));
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  },
  get(store, key) { return this._db ? this._req(store, 'readonly', s => s.get(key)) : Promise.resolve(this.mem[store].get(key)); },
  put(store, key, val) { return this._db ? this._req(store, 'readwrite', s => s.put(val, key)) : Promise.resolve(this.mem[store].set(key, val)); },
  del(store, key) { return this._db ? this._req(store, 'readwrite', s => s.delete(key)) : Promise.resolve(this.mem[store].delete(key)); },
  clear(store) { return this._db ? this._req(store, 'readwrite', s => s.clear()) : Promise.resolve(this.mem[store].clear()); }
};

/* ---------- state ---------- */
function blankState() {
  return {
    v: 1,
    settings: {
      company: { name: '', abn: '', phone: '', email: '', address: '', logo: '' },
      inspector: { name: '', quals: '' },
      quarters: ['red', 'green', 'blue', 'yellow'],
      types: {},
      prefix: 'LR', nextNo: 1,
      photoEveryItem: false,
      disclaimer: DEFAULT_DISCLAIMER,
      onboarded: false
    },
    clients: [], assets: [], visits: [], inspections: []
  };
}
let S = blankState();
const PH = new Map();           /* photo cache: id -> data URL */
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { DB.put('kv', 'state', S).catch(() => toast('Could not save. Storage may be full.')); }, 120);
}
function saveNow() { clearTimeout(saveTimer); return DB.put('kv', 'state', S); }

const client = id => S.clients.find(c => c.id === id);
const asset  = id => S.assets.find(a => a.id === id);
const visit  = id => S.visits.find(v => v.id === id);
const insp   = id => S.inspections.find(i => i.id === id);
const visitInsps = vid => S.inspections.filter(i => i.visitId === vid);
const typeOf = a => {
  const t = TYPES.find(t => t.id === (a && a.type)) || TYPES[TYPES.length - 1];
  const o = S.settings.types[t.id] || {};
  return { ...t, std: o.std ?? t.std, months: o.months ?? t.months };
};
const typeById = id => typeOf({ type: id });
const itemLabel = a => typeOf(a).name + ' ' + (a.ident.trim() || 'with no ID');
const tagFor = iso => S.settings.quarters[Math.floor(parseISO(iso).getMonth() / 3)] || 'yellow';
const quarterOf = iso => QUARTERS[Math.floor(parseISO(iso).getMonth() / 3)];

function counts(vid) {
  const c = { total: 0, pass: 0, fail: 0, repair: 0, missing: 0, todo: 0 };
  visitInsps(vid).forEach(i => { c.total++; c[i.result || 'todo']++; });
  c.done = c.total - c.todo; c.action = c.fail + c.repair;
  return c;
}

/* Latest recorded result for an asset, across all visits. */
function lastInsp(aid) {
  let best = null;
  S.inspections.forEach(i => {
    if (i.assetId !== aid || !i.result) return;
    const v = visit(i.visitId); if (!v) return;
    if (!best || v.date >= best.v.date) best = { i, v };
  });
  return best;
}
function dueAssets(within = 30) {
  return S.assets.filter(a => !a.retired).map(a => {
    const l = lastInsp(a.id);
    if (!l || !l.i.nextDue) return null;
    return { a, l, days: daysFromToday(l.i.nextDue) };
  }).filter(x => x && x.days <= within).sort((x, y) => x.days - y.days);
}
const openVisitFor = cid => S.visits.find(v => v.clientId === cid && v.status === 'open');

/* The readiness gate. A report cannot be issued while any 'block' entry exists. */
function gate(v) {
  const out = [];
  const L = visitInsps(v.id);
  if (!S.settings.company.name.trim()) out.push({ kind: 'block', text: 'Add your business name so it appears on the report', nav: 'settings' });
  /* a report states an inspection that happened: never on a date still to come */
  if (v.date > todayISO()) out.push({ kind: 'block', text: 'The inspection date is ' + fmtDate(v.date) + ', which has not happened yet. Change it to the day you inspected', panel: 'details' });
  if (!L.length) out.push({ kind: 'block', text: 'Add at least one item to this visit' });
  L.forEach(i => {
    const a = asset(i.assetId), t = typeOf(a), label = itemLabel(a);
    if (!i.result) out.push({ kind: 'block', text: label + ' has no result', fix: 'add a result', item: i.id });
    if (!a.ident.trim()) out.push({ kind: 'block', text: t.name + ' has no ID or serial number', fix: 'add an ID', item: i.id });
    if (t.wll && !String(a.wll).trim() && i.result && i.result !== 'missing') out.push({ kind: 'block', text: label + ' has no working load limit', fix: 'add the working load limit', item: i.id });
    if (i.result === 'fail' || i.result === 'repair') {
      if (!i.defects.length && !i.notes.trim()) out.push({ kind: 'block', text: label + ' needs a defect or a note explaining the result', fix: 'add a defect or a note', item: i.id });
      if (!i.photos.length) out.push({ kind: 'block', text: label + ' needs a photo of the defect', fix: 'add a photo of the defect', item: i.id });
    }
    if (S.settings.photoEveryItem && i.result === 'pass' && !i.photos.length) out.push({ kind: 'block', text: label + ' needs a photo', fix: 'add a photo', item: i.id });
    /* a voice draft is only a draft until the inspector has checked it */
    const open = (i.voice || []).filter(n => n.status !== 'checked'), typing = open.filter(n => n.status === 'queued' || n.status === 'transcribing').length;
    const packReady = typeof Voice !== 'undefined' && Voice.state === 'ready';
    if (typing && !packReady) out.push({ kind: 'block', text: label + (typing === 1 ? ' has a voice note waiting for a draft' : ` has ${typing} voice notes waiting for a draft`) + '. Download voice notes in Settings, or type it yourself', fix: typing === 1 ? 'download voice notes in Settings or type the note yourself' : 'download voice notes in Settings or type the notes yourself', item: i.id });
    else if (typing) out.push({ kind: 'block', text: label + (typing === 1 ? ' has a voice note still being typed' : ` has ${typing} voice notes still being typed`), fix: typing === 1 ? 'wait for the voice note to finish typing' : `wait for ${typing} voice notes to finish typing`, item: i.id });
    else if (open.length) out.push({ kind: 'block', text: label + (open.length === 1 ? ' has a voice note to check' : ` has ${open.length} voice notes to check`), fix: open.length === 1 ? 'check the voice note' : `check ${open.length} voice notes`, item: i.id });
  });
  if (!String(v.inspector || '').trim()) out.push({ kind: 'block', text: 'Inspector name is missing', focus: 'inspector' });
  if (!v.signInspector) out.push({ kind: 'block', text: 'Inspector signature is missing', sign: 'inspector' });
  if (!v.signClient) out.push({ kind: 'advise', text: 'No client signature yet. You can still issue the report.', sign: 'client' });
  return out;
}

/* One readiness line per item: several problems on one item merge into a single line. */
const joinAnd = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
function groupGate(list) {
  const by = new Map(), out = [];
  list.forEach(g => {
    if (!g.item) { out.push(g); return; }
    if (!by.has(g.item)) { const e = { items: [], at: out.length }; by.set(g.item, e); out.push(null); }
    by.get(g.item).items.push(g);
  });
  by.forEach((e, id) => {
    const L = e.items;
    if (L.length === 1) { out[e.at] = L[0]; return; }
    const i = insp(id), a = i && asset(i.assetId), ident = a ? String(a.ident || '').trim() : '';
    const label = typeOf(a).name + (ident ? ' ' + ident : '');
    const fixes = L.map(x => x.fix).filter(Boolean), idf = fixes.filter(f => f === 'add an ID');
    out[e.at] = { kind: L.some(x => x.kind === 'block') ? 'block' : 'advise', text: label + ': ' + joinAnd(idf.concat(fixes.filter(f => f !== 'add an ID'))), item: id };
  });
  return out;
}
const gateLines = v => groupGate(gate(v));

/* Phone as typed is stored; only the tel: link is normalised. */
function telHref(p) {
  const s = String(p == null ? '' : p).trim(), d = s.replace(/\D/g, '');
  return d ? 'tel:' + (s[0] === '+' ? '+' : '') + d : '';
}

/* Another register item for the same client with the same ID. A re-inspection reuses the asset id, so it never matches itself. */
function dupIdent(a, visitId) {
  const id = a && String(a.ident || '').trim().toLowerCase(); if (!id) return null;
  const other = S.assets.find(o => o.id !== a.id && o.clientId === a.clientId && String(o.ident || '').trim().toLowerCase() === id);
  if (!other) return null;
  const mine = S.inspections.filter(i => i.assetId === other.id), l = lastInsp(other.id), ov = mine.map(i => visit(i.visitId)).find(Boolean);
  const where = mine.some(i => i.visitId === visitId) ? 'on this visit'
    : l ? 'last inspected ' + fmtDate(l.v.date) + (l.v.reportNo ? ', report ' + l.v.reportNo : '')
    : ov ? 'on the visit of ' + fmtDate(ov.date) : 'on the register';
  return { other, where: (other.retired ? 'retired, ' : '') + where };
}

/* Every item has a voice list. A note that was being typed when the app closed goes back in the queue. */
function normVoice() {
  S.inspections.forEach(i => { i.voice = i.voice || []; i.voice.forEach(n => { if (n.status === 'transcribing') n.status = 'queued'; }); });
}
const findNote = id => { for (const i of S.inspections) { const n = (i.voice || []).find(x => x.id === id); if (n) return { n, i }; } return null; };

/* The vocabulary hint handed to the voice typer: fixed terms, equipment names, then defect phrases (shorter first). */
function voicePrompt() {
  const terms = ['WLL', 'tonne', 'tagged out', 'red tag', 'green tag', 'blue tag', 'yellow tag', 'serviceable', 'withdraw from service'];
  const seen = new Set(terms.map(t => t.toLowerCase()));
  const add = t => { t = t.trim(); if (t && !seen.has(t.toLowerCase())) { seen.add(t.toLowerCase()); terms.push(t); } };
  TYPES.filter(t => t.id !== 'other').forEach(t => t.name.toLowerCase().split(' or ').forEach(add));
  const defects = [];
  TYPES.forEach(t => t.defects.forEach(d => defects.push(d.toLowerCase())));
  defects.sort((a, b) => a.length - b.length).forEach(add);
  return 'Lifting gear inspection notes. ' + terms.join(', ');
}

/* ---------- record creation ---------- */
function newAsset(clientId, typeId, like) {
  const t = typeById(typeId);
  const a = { id: 'a' + uid(), clientId, type: typeId, ident: '', wll: '', wllUnit: 't', make: '', desc: '', location: '', std: t.std, retired: false, createdAt: todayISO() };
  if (like) Object.assign(a, { wll: like.wll, wllUnit: like.wllUnit, make: like.make, desc: like.desc, location: like.location, std: like.std });
  S.assets.push(a); return a;
}
function newInsp(visitId, assetId) {
  const i = { id: 'i' + uid(), visitId, assetId, result: '', defects: [], notes: '', photos: [], voice: [], nextDue: '' };
  S.inspections.push(i); return i;
}
function newVisit(clientId, date, tag, bringForward) {
  const v = { id: 'v' + uid(), clientId, date, tag, status: 'open', reportNo: '', issuedAt: '', rev: 0,
    inspector: S.settings.inspector.name, scope: '', signInspector: '', signClient: '', clientRep: '' };
  S.visits.unshift(v);
  if (bringForward) S.assets.filter(a => a.clientId === clientId && !a.retired).forEach(a => newInsp(v.id, a.id));
  return v;
}
function setResult(i, result) {
  const v = visit(i.visitId), a = asset(i.assetId);
  i.result = result;
  i.nextDue = result === 'pass' ? addMonths(v.date, typeOf(a).months) : '';
  if (result === 'pass' || result === 'missing') i.defects = [];
}
async function removeInsp(id) {
  const i = insp(id); if (!i) return;
  for (const p of i.photos) { PH.delete(p); await DB.del('photos', p); }
  for (const n of (i.voice || [])) await DB.del('audio', n.audioId);
  S.inspections = S.inspections.filter(x => x.id !== id);
  /* drop the asset too if this was its only inspection */
  if (!S.inspections.some(x => x.assetId === i.assetId)) S.assets = S.assets.filter(a => a.id !== i.assetId);
}
