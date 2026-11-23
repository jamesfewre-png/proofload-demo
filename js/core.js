'use strict';
/* TagRound core: constants, storage, state, helpers. No network calls anywhere in this app. */

const APP = { name: 'TagRound', version: '0.4.2' };  /* renamed from Proofload in 0.3.1; storage keeps the internal name 'proofload' */

const TAGS = {
  red:    { name: 'Red',    hex: '#D7332A', on: '#FFFFFF' },
  green:  { name: 'Green',  hex: '#1F9D55', on: '#17212B' },
  blue:   { name: 'Blue',   hex: '#1D6AE5', on: '#FFFFFF' },
  yellow: { name: 'Yellow', hex: '#F4B800', on: '#17212B' },
  orange: { name: 'Orange', hex: '#EC6A12', on: '#17212B' },
  purple: { name: 'Purple', hex: '#7B46C9', on: '#FFFFFF' },
  white:  { name: 'White',  hex: '#FFFFFF', on: '#17212B' }
};
const PERIODS = { 0: ['Jan to Mar', 'Apr to Jun', 'Jul to Sep', 'Oct to Dec'], 11: ['Dec to Feb', 'Mar to May', 'Jun to Aug', 'Sep to Nov'] };
/* lower-case plural per type, for helper text */
const TYPE_PLURALS = { chain: 'chain slings', wire: 'wire rope slings', web: 'flat webbing slings', round: 'round slings', shackle: 'shackles', hoist: 'chain blocks and lever hoists', clamp: 'beam clamps and trolleys', eyebolt: 'eyebolts and lifting points', beam: 'spreader and lifting beams', hook: 'hooks and master links', harness: 'safety harnesses', lanyard: 'lanyards and inertia reels', other: 'other lifting gear' };
/* intervals before A19, kept for installs that already hold records */
const OLD_MONTHS = { chain: 12, wire: 12, web: 3, round: 3, shackle: 12, hoist: 12, clamp: 12, eyebolt: 12, beam: 12, hook: 12, harness: 6, lanyard: 6, other: 12 };

/* Standard references and intervals are starting defaults only.
   They are editable in Settings and must be confirmed against the current
   standard and the site procedure by a competent person. */
const TYPES = [
  { id: 'chain', name: 'Chain sling', std: 'AS 3775.2', months: 3, wll: true, hint: '2-leg, 10 mm, Grade T(80), 3 m',
    defects: ['Stretched or elongated links', 'Bent or twisted links', 'Nicks or gouges', 'Wear beyond limit', 'Corrosion or pitting', 'Heat damage', 'Coupling seized or damaged', 'Hook throat opened', 'Safety latch missing or damaged', 'Tag or marking missing or illegible'] },
  { id: 'wire', name: 'Wire rope sling', std: 'AS 1666.2', months: 3, wll: true, hint: '16 mm, 4 m, soft eyes',
    defects: ['Broken wires', 'Kinks', 'Birdcaging', 'Crushing or flattening', 'Wear or abrasion', 'Corrosion', 'Heat damage', 'Ferrule damage', 'Thimble damage', 'Tag or marking missing or illegible'] },
  { id: 'web', name: 'Flat webbing sling', std: 'AS 1353.2', months: 3, wll: true, hint: '50 mm, 2 m',
    defects: ['Cuts or tears', 'Abrasion', 'Chemical damage', 'Heat or friction damage', 'Stitching damaged', 'UV degradation', 'Knots', 'Paint or marker contamination', 'Tag or marking missing or illegible'] },
  { id: 'round', name: 'Round sling', std: 'AS 4497', months: 3, wll: true, hint: 'Endless, 2 m',
    defects: ['Cover cut, core exposed', 'Unexplained lump under the cover', 'Abrasion', 'Chemical damage', 'Heat damage', 'Knots', 'Tag or marking missing or illegible'] },
  { id: 'shackle', name: 'Shackle', std: 'AS 2741', months: 3, wll: true, hint: 'Bow, 19 mm pin',
    defects: ['Pin bent', 'Pin not fully seated', 'Thread damage', 'Wrong pin fitted', 'Wear in crown or pin', 'Deformation', 'Cracks', 'Tag or marking missing or illegible'] },
  { id: 'hoist', name: 'Chain block or lever hoist', std: 'AS 1418.2', months: 3, wll: true, cap: true, hint: 'Chain block, 3 m lift',
    defects: ['Load chain wear', 'Hook deformation', 'Safety latch missing', 'Brake slipping', 'Casing damage', 'Chain not running freely', 'Data plate missing or illegible'] },
  { id: 'clamp', name: 'Beam clamp or trolley', std: 'AS 4991', months: 3, wll: true, hint: '75 to 230 mm flange',
    defects: ['Jaw wear', 'Screw thread damage', 'Deformation', 'Cracks', 'Tag or marking missing or illegible'] },
  { id: 'eyebolt', name: 'Eyebolt or lifting point', std: 'AS 2317', months: 3, wll: true, hint: 'M20 collared',
    defects: ['Thread damage', 'Bent shank', 'Eye deformation', 'Corrosion', 'Tag or marking missing or illegible'] },
  { id: 'beam', name: 'Spreader or lifting beam', std: 'AS 4991', months: 3, wll: true, hint: '3 m, 2 lugs',
    defects: ['Weld cracks', 'Deformation', 'Lug wear', 'Corrosion', 'Data plate missing or illegible'] },
  { id: 'hook', name: 'Hook or master link', std: 'AS 3776', months: 3, wll: true, hint: 'Sling hook with latch',
    defects: ['Throat opening increased', 'Twist', 'Wear', 'Cracks', 'Safety latch missing or damaged', 'Tag or marking missing or illegible'] },
  { id: 'harness', name: 'Safety harness', std: 'AS/NZS 1891.4', months: 6, wll: false, hint: 'Full body, size M-L',
    defects: ['Webbing cuts or fraying', 'Stitching damaged', 'Buckle or D-ring damage', 'Fall indicator deployed', 'Chemical or UV damage', 'Tag or marking missing or illegible'] },
  { id: 'lanyard', name: 'Lanyard or inertia reel', std: 'AS/NZS 1891.4', months: 6, wll: false, hint: 'Twin-tail, 2 m',
    defects: ['Webbing or rope damage', 'Shock absorber deployed', 'Hook gate faulty', 'Housing damage', 'Does not lock or retract', 'Tag or marking missing or illegible'] },
  { id: 'other', name: 'Other lifting gear', std: '', months: 3, wll: true, hint: 'Describe the item',
    defects: ['Deformation', 'Wear', 'Corrosion', 'Cracks', 'Tag or marking missing or illegible'] }
];

/* What was done with failed or repair gear, by result. */
const ACTIONS = { fail: ['Danger tag fitted', 'Destroyed on site', 'Quarantined on site', 'Returned to the client'], repair: ['Danger tag fitted', 'Quarantined on site', 'Sent for repair', 'Returned to the client'] };
/* "Danger tag fitted, quarantined on site." */
const actionText = l => (l && l.length) ? l.map((x, k) => k ? x.charAt(0).toLowerCase() + x.slice(1) : x).join(', ') + '.' : '';

const RESULTS = {
  pass:    { label: 'Pass',          long: 'Fit for service' },
  fail:    { label: 'Fail',          long: 'Withdraw from service' },
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
      photoEveryItem: false, tagStart: 0, lastBackupAt: '', intervalsV2: true,
      disclaimer: DEFAULT_DISCLAIMER,
      onboarded: false,
      licence: ''
    },
    clients: [], assets: [], visits: [], inspections: []
  };
}
let S = blankState();
const PH = new Map();           /* photo cache: id -> data URL */
let saveTimer = null;
/* ---------- signature integrity: a signature confirms the findings as shown, so any later change to them voids it ---------- */
/* Small deterministic string hash (cyrb53, base36). An integrity check against accidental change, not security. */
function hashStr(str) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let k = 0; k < str.length; k++) { const c = str.charCodeAt(k); h1 = Math.imul(h1 ^ c, 2654435761); h2 = Math.imul(h2 ^ c, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
}
/* Everything the printed report states about the findings. Voice drafts, lastPassed, company, client and settings are left out. */
function findingsPayload(v) {
  return { date: v.date, tag: v.tag, scope: v.scope || '', items: visitInsps(v.id).map(i => { const a = asset(i.assetId) || {}; return [i.id, a.id, a.type, a.ident, a.desc, a.wll, a.wllUnit, a.make, a.certNo || '', a.location, a.std, i.result, i.defects, i.actions || [], !!i.retest, i.notes, i.photos, i.nextDue]; }) };
}
/* The client rep name voids only the client signature; the inspector name voids only the inspector signature. */
const sigKey = (v, who) => hashStr(JSON.stringify([findingsPayload(v), who, who === 'inspector' ? String(v.inspector || '') : String(v.clientRep || '')]));
function signVisit(v, who, data) {
  if (!v || v.status !== 'open' || sigLock(v)) return false;
  if (who === 'inspector') { v.signInspector = data; v.signInspectorKey = sigKey(v, 'inspector'); }
  else { v.signClient = data; v.signClientKey = sigKey(v, 'client'); }
  return true;
}
/* Open visits only. A signature with no key (older data) adopts the current findings; a key that no longer matches clears the signature. Returns how many were cleared. */
function voidStaleSigs() {
  let n = 0;
  S.visits.forEach(v => {
    if (v.status !== 'open') return;
    [['inspector', 'signInspector', 'signInspectorKey'], ['client', 'signClient', 'signClientKey']].forEach(([who, sf, kf]) => {
      if (!v[sf]) return;
      if (!v[kf]) v[kf] = sigKey(v, who);
      else if (v[kf] !== sigKey(v, who)) { v[sf] = ''; v[kf] = ''; n++; }
    });
  });
  return n;
}
const SIG_VOID_MSG = 'Findings changed after signing. Sign again.';
/* The one hook: every change goes through save(), so signatures are checked here. True when any signature was cleared. */
function save() {
  const voided = voidStaleSigs() > 0;
  if (voided) toast(SIG_VOID_MSG);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => { DB.put('kv', 'state', S).catch(() => toast('Could not save. Storage may be full.')); }, 120);
  return voided;
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
const tagStartOf = () => S.settings.tagStart === 11 ? 11 : 0;
const periodIdx = iso => Math.floor(((parseISO(iso).getMonth() - tagStartOf() + 12) % 12) / 3);
const tagFor = iso => S.settings.quarters[periodIdx(iso)] || 'yellow';
const periodOf = iso => PERIODS[tagStartOf()][periodIdx(iso)];
const quarterOf = periodOf;
/* change a visit date: a tag still on the default for the old date follows the new date; due dates follow too */
function setVisitDate(v, iso) {
  const wasDefault = v.tag === tagFor(v.date);
  v.date = iso;
  if (wasDefault) v.tag = tagFor(iso);
  visitInsps(v.id).forEach(i => { if (i.result === 'pass') i.nextDue = addMonths(v.date, typeOf(asset(i.assetId)).months); else if (i.result === 'missing') i.nextDue = priorDue(i); });
}

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
/* The due date an asset carried into this visit, from the latest earlier visit that gave it one (pass or not presented). */
function priorDue(i) {
  const v = visit(i.visitId); if (!v) return '';
  let best = null;
  S.inspections.forEach(o => {
    if (o.assetId !== i.assetId || o.visitId === i.visitId || !o.nextDue || (o.result !== 'pass' && o.result !== 'missing')) return;
    const ov = visit(o.visitId); if (!ov || !(ov.date < v.date)) return;
    if (!best || ov.date >= best.v.date) best = { o, v: ov };
  });
  return best ? best.o.nextDue : '';
}
/* The date of the latest earlier pass of this asset, on a strictly earlier visit. */
function lastPassedBefore(i) {
  const v = visit(i.visitId); if (!v) return '';
  let best = '';
  S.inspections.forEach(o => {
    if (o.assetId !== i.assetId || o.visitId === i.visitId || o.result !== 'pass') return;
    const ov = visit(o.visitId); if (ov && ov.date < v.date && ov.date > best) best = ov.date;
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
/* Gear whose latest result is Repair and that is still on the active register. */
function repairAssets() {
  return S.assets.filter(a => !a.retired).map(a => { const l = lastInsp(a.id); return l && l.i.result === 'repair' ? { a, l } : null; }).filter(Boolean).sort((x, y) => x.l.v.date.localeCompare(y.l.v.date));
}
/* WLL text: a comma becomes a full stop; a working load limit is a plain number. */
const normWll = s => String(s == null ? '' : s).replace(/,/g, '.').trim();
const wllIsNumber = s => /^\d+(\.\d+)?$/.test(String(s).trim());
const wllName = t => t.cap ? 'rated capacity' : 'working load limit';
const openVisitFor = cid => S.visits.find(v => v.clientId === cid && v.status === 'open');

/* The readiness gate. A report cannot be issued while any 'block' entry exists. */
function gateFindings(v) {
  const out = [];
  const L = visitInsps(v.id);
  if (!S.settings.company.name.trim()) out.push({ kind: 'block', text: 'Add your business name so it appears on the report', nav: 'settings' });
  /* a report states an inspection that happened: never on a date still to come */
  if (v.date > todayISO()) out.push({ kind: 'block', text: 'The inspection date is ' + fmtDate(v.date) + ', which has not happened yet. Change it to the day you inspected', panel: 'details' });
  if (!L.length) out.push({ kind: 'block', text: 'Add at least one item to this visit' });
  L.forEach(i => {
    const a = asset(i.assetId), t = typeOf(a), label = itemLabel(a);
    if (!i.result) out.push({ kind: 'block', text: label + ' has no result', fix: 'add a result', item: i.id, noResult: true });
    if (!a.ident.trim()) out.push({ kind: 'block', text: t.name + ' has no ID or serial number', fix: 'add an ID', item: i.id });
    if (t.wll && !String(a.wll).trim() && i.result && i.result !== 'missing') out.push({ kind: 'block', text: label + ' has no ' + wllName(t), fix: 'add the ' + wllName(t), item: i.id });
    if (t.wll && String(a.wll).trim() && !wllIsNumber(a.wll) && i.result && i.result !== 'missing') out.push({ kind: 'block', text: label + ' has a ' + wllName(t) + ' that is not a number', fix: 'enter the ' + wllName(t) + ' as a number', item: i.id });
    if (i.result === 'fail' || i.result === 'repair') {
      if (!i.defects.length && !i.notes.trim()) out.push({ kind: 'block', text: label + ' needs a defect or a note explaining the result', fix: 'add a defect or a note', item: i.id });
      if (!i.photos.length) out.push({ kind: 'block', text: label + ' needs a photo of the defect', fix: 'add a photo of the defect', item: i.id });
      if (!(i.actions || []).length) out.push({ kind: 'block', text: label + ' needs what was done with it', fix: 'say what was done with it', item: i.id });
    }
    if (S.settings.photoEveryItem && i.result === 'pass' && !i.photos.length) out.push({ kind: 'block', text: label + ' needs a photo', fix: 'add a photo', item: i.id });
    /* a voice draft is only a draft until the inspector has checked it */
    const open = (i.voice || []).filter(n => n.status !== 'checked'), typing = open.filter(n => n.status === 'queued' || n.status === 'transcribing').length;
    const packReady = typeof Voice !== 'undefined' && Voice.state === 'ready';
    if (typing && !packReady) out.push({ kind: 'block', text: label + (typing === 1 ? ' has a voice note waiting for a draft' : ` has ${typing} voice notes waiting for a draft`) + '. Download voice notes in Settings, or type it yourself', fix: typing === 1 ? 'download voice notes in Settings or type the note yourself' : 'download voice notes in Settings or type the notes yourself', item: i.id });
    else if (typing) out.push({ kind: 'block', text: label + (typing === 1 ? ' has a voice note still being written' : ` has ${typing} voice notes still being written`), fix: typing === 1 ? 'wait for the voice note to be written' : `wait for ${typing} voice notes to be written`, item: i.id });
    else if (open.length) out.push({ kind: 'block', text: label + (open.length === 1 ? ' has a voice note to check' : ` has ${open.length} voice notes to check`), fix: open.length === 1 ? 'check the voice note' : `check ${open.length} voice notes`, item: i.id });
  });
  if (!String(v.inspector || '').trim()) out.push({ kind: 'block', text: 'Inspector name is missing', focus: 'inspectorInput' });
  if (!String(v.inspectorQuals || '').trim()) out.push({ kind: 'advise', text: "Add the inspector's competency so the report shows it", focus: 'qualsInput' });
  return out;
}
/* The full readiness gate: the findings, then the two signature lines. While the findings are unfinished the signature lines carry no
   'sign' target, so tapping them does nothing. */
function gate(v) {
  const out = gateFindings(v), lock = sigLock(v);
  if (!v.signInspector) out.push(lock ? { kind: 'block', text: 'Inspector signature: after the inspection is finished' } : { kind: 'block', text: 'Inspector signature is missing', sign: 'inspector' });
  if (!v.signClient) { const g = { kind: 'advise', text: 'No client signature yet. You can still issue the report.' }; if (!lock) g.sign = 'client'; out.push(g); }
  return out;
}
/* null when signing is allowed; otherwise what is left to do before the inspector can sign. */
function sigLock(v) {
  const blocks = gateFindings(v).filter(x => x.kind === 'block');
  if (!blocks.length) return null;
  const L = visitInsps(v.id);
  const toInspect = L.filter(i => !i.result).length;
  const toFix = groupGate(blocks.filter(x => !x.noResult)).length;
  if (!L.length) return { toInspect, toFix, text: 'Add the first item before signing.' };
  const parts = [];
  if (toInspect > 0) parts.push(`${toInspect} to inspect`);
  if (toFix > 0) parts.push(`${toFix} to fix`);
  return { toInspect, toFix, text: 'Finish the inspection first: ' + parts.join(', ') + '.' };
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

/* Which route should actually be shown: an issued visit opens its report; an open visit's report (not a preview or earlier version) goes back to the visit. */
function routeFor(r) {
  const v = (r.name === 'visit' || r.name === 'report') ? visit(r.id) : null;
  if (!v) return r;
  if (r.name === 'visit' && v.status === 'issued') return { name: 'report', id: r.id };
  if (r.name === 'report' && v.status !== 'issued' && !r.preview && r.rev === undefined) return { name: 'visit', id: r.id, panel: '' };
  return r;
}

/* Backup reminder (A21). '' when none is needed, else the text for "Last backup: ...": 'never', '1 day ago' or 'n days ago'.
   Needed when a report has been issued and the data is not backed up: never backed up, or the last backup is 7+ days old and a report
   was issued on or after that day (issuedAt has no time, so the comparison is by local date; a false reminder beats a missed one). */
function backupReminder(now = new Date()) {
  if (!S.visits.some(v => v.status === 'issued' || v.issuedAt)) return '';
  const raw = S.settings.lastBackupAt, last = raw ? new Date(raw) : null;
  if (!last || isNaN(last)) return 'never';
  if (now - last < 7 * 864e5) return '';
  const day = toISO(last);
  if (!S.visits.some(v => v.issuedAt && v.issuedAt >= day)) return '';
  const n = Math.floor((now - last) / 864e5);
  return n === 1 ? '1 day ago' : n + ' days ago';
}
/* Returns a function that puts an inspection's result fields back as they are now (used by Undo after a one-tap pass). */
function resultUndo(i) {
  const s = { result: i.result, nextDue: i.nextDue, defects: [...i.defects], actions: [...(i.actions || [])], retest: !!i.retest };
  return () => { const v = visit(i.visitId); if (!insp(i.id) || !v || v.status !== 'open') return false; Object.assign(i, s, { defects: [...s.defects], actions: [...s.actions] }); return true; };
}

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
  const a = { id: 'a' + uid(), clientId, type: typeId, ident: '', wll: '', wllUnit: 't', make: '', certNo: '', desc: '', location: '', std: t.std, retired: false, createdAt: todayISO() };
  if (like) Object.assign(a, { wll: like.wll, wllUnit: like.wllUnit, make: like.make, desc: like.desc, location: like.location, std: like.std });
  S.assets.push(a); return a;
}
function newInsp(visitId, assetId) {
  const i = { id: 'i' + uid(), visitId, assetId, result: '', defects: [], notes: '', photos: [], voice: [], nextDue: '', actions: [], retest: false };
  S.inspections.push(i); return i;
}
function newVisit(clientId, date, tag, bringForward) {
  const v = { id: 'v' + uid(), clientId, date, tag, status: 'open', reportNo: '', issuedAt: '', rev: 0,
    inspector: S.settings.inspector.name, scope: '', signInspector: '', signClient: '', clientRep: '',
    inspectorQuals: S.settings.inspector.quals, revisions: [], revReason: '', snapshot: null };
  S.visits.unshift(v);
  if (bringForward) S.assets.filter(a => a.clientId === clientId && !a.retired).forEach(a => newInsp(v.id, a.id));
  return v;
}
/* Bring register items into an open visit. Callers save(). Issued visits are never touched. */
function registerMissing(v) {
  if (!v || v.status !== 'open') return [];
  const on = new Set(visitInsps(v.id).map(i => i.assetId));
  return S.assets.filter(a => a.clientId === v.clientId && !a.retired && !on.has(a.id));
}
function bringIn(v, assetIds) {
  if (!v || v.status !== 'open') return [];
  const ok = new Set(registerMissing(v).map(a => a.id)), out = [];
  (assetIds || []).forEach(id => { if (ok.has(id)) { ok.delete(id); out.push(newInsp(v.id, id)); } });
  return out;
}
function commitImportToVisit(items, target, visitId) {
  const before = new Set(S.assets.map(a => a.id));
  const r = commitImport(items, target);
  const v = visit(visitId);
  r.added = 0;
  if (v) {
    r.added = bringIn(v, S.assets.filter(a => !before.has(a.id)).map(a => a.id)).length;
    if (r.added > 0) r.voided = save();
  }
  return r;
}
function setResult(i, result) {
  const v = visit(i.visitId), a = asset(i.assetId), was = i.result;
  i.result = result;
  i.nextDue = result === 'pass' ? addMonths(v.date, typeOf(a).months) : result === 'missing' ? priorDue(i) : '';
  if (result === 'pass' || result === 'missing') i.defects = [];
  /* what was done with it: cleared for pass or not presented; between fail and repair only the actions valid for both stay */
  i.actions = ACTIONS[result] ? (i.actions || []).filter(x => ACTIONS[result].includes(x)) : [];
  /* a proof load test after repair is suggested for load-bearing gear the first time it is marked repair */
  i.retest = result === 'repair' ? (was === 'repair' ? !!i.retest : ['chain', 'hoist', 'beam'].includes(a.type)) : false;
}
async function removeInsp(id) {
  const i = insp(id); if (!i) return;
  for (const p of i.photos) if (!photoInSnapshots(p)) { PH.delete(p); await DB.del('photos', p); }
  for (const n of (i.voice || [])) await DB.del('audio', n.audioId);
  S.inspections = S.inspections.filter(x => x.id !== id);
  /* drop the asset too if this was its only inspection */
  if (!S.inspections.some(x => x.assetId === i.assetId)) S.assets = S.assets.filter(a => a.id !== i.assetId);
}

/* ---------- frozen reports: photos, numbering ---------- */
/* Every photo id a visit's frozen reports (current snapshot and earlier versions) still show. */
function snapshotPhotoIds(v) {
  const out = [], take = sn => { if (sn && sn.items) sn.items.forEach(x => (x.photos || []).forEach(p => out.push(p))); };
  take(v.snapshot); (v.revisions || []).forEach(r => take(r.snapshot));
  return out;
}
const photoInSnapshots = id => S.visits.some(v => snapshotPhotoIds(v).includes(id));

const reportNoPrefix = () => S.settings.prefix || 'LR';
const fmtReportNo = (prefix, n) => prefix + '-' + String(n).padStart(4, '0');
/* Every report number already used, by a visit or by one of its earlier versions. */
function usedReportNos() {
  const used = new Set();
  S.visits.forEach(v => { if (v.reportNo) used.add(v.reportNo); (v.revisions || []).forEach(r => { if (r.reportNo) used.add(r.reportNo); }); });
  return used;
}
/* The next free report number. Skips any number in use and leaves nextNo at the used number + 1. */
function allocReportNo() {
  const prefix = reportNoPrefix(), used = usedReportNos();
  let n = parseInt(S.settings.nextNo, 10) || 1;
  while (used.has(fmtReportNo(prefix, n))) n++;
  S.settings.nextNo = n + 1;
  return fmtReportNo(prefix, n);
}
/* The warning under "Next number": '' unless a number with this prefix at or above n has been issued. */
function nextNoWarning(prefix, n) {
  prefix = prefix || 'LR'; n = parseInt(n, 10) || 1;
  const pre = prefix + '-'; let max = 0;
  usedReportNos().forEach(no => { if (no.startsWith(pre) && /^\d+$/.test(no.slice(pre.length))) max = Math.max(max, parseInt(no.slice(pre.length), 10)); });
  return max && max >= n ? `${fmtReportNo(prefix, max)} has already been issued. The next free number is ${max + 1}.` : '';
}

/* ---------- licence: a deterrent, never a lock. Offline check of a signed key. ---------- */
/* A key is a signed payload (ECDSA P-256, SHA-256): ver(1) id(4) issued(2) updatesUntil(2) seats(1) nameLen(1) name(<=40), then a 64-byte
   signature, written as 'TR1-' + Crockford base32. Nothing is ever disabled: no key only adds an evaluation footer to reports. */
const SELLER = { name: 'AI Flow Systems', contact: 'Contact your TagRound supplier' };
const LICENCE_PUBLIC_KEY = 'BIPxzmq5K23Y2dCsJrbL6e9Ecs2cbkLMetLlahKSqTfc0LkzaPUVWkBaFfqBNAbV9K6ejNQjlzEujhEXjTyYP20';
const EVAL_FOOTER = 'Unlicensed evaluation copy. Not for issue to clients.';
const LIC_MSG = { bad: 'That key did not check out. Check it was copied completely, or contact us.', noCrypto: 'Licence keys can only be checked when TagRound is opened from its secure web address.' };
let licencePub = LICENCE_PUBLIC_KEY;   /* test seam: tests point this at a throwaway public key; the app never changes it */
const LIC = { status: 'none', info: null };   /* 'none' | 'valid' | 'invalid' | 'unchecked' (no crypto here). In memory only. */
const B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const LIC_EPOCH = Date.UTC(2026, 0, 1);
const licDate = n => new Date(LIC_EPOCH + n * 864e5).toISOString().slice(0, 10);
function b32Encode(u8) {
  let bits = 0, v = 0, o = '';
  for (const b of u8) { v = (v << 8) | b; bits += 8; while (bits >= 5) { o += B32[(v >>> (bits - 5)) & 31]; bits -= 5; } v &= 255; }
  if (bits) o += B32[(v << (5 - bits)) & 31];
  return o;
}
const normLicenceKey = u8 => 'TR1-' + b32Encode(u8).match(/.{1,6}/g).join('-');
/* Every plausible key in a text: one per 'TR1' (a key file may have a heading line), or the whole text when there is none. */
function licenceCandidates(text) {
  const up = String(text == null ? '' : text).toUpperCase(), starts = [];
  const re = /TR[1IL]/g;   /* the prefix, with the same O/I/L leniency as the body */
  for (let m = re.exec(up); m; m = re.exec(up)) { starts.push(m.index + 3); re.lastIndex = m.index + 1; }
  if (!starts.length) starts.push(0);
  const out = [];
  starts.forEach(from => {
    const chars = [];
    for (let k = from; k < up.length; k++) {
      let c = up[k];
      if (c === ' ' || c === '\t' || c === '\n' || c === '\r' || c === '-' || /\s/.test(c)) continue;
      if (c === 'O') c = '0'; else if (c === 'I' || c === 'L') c = '1';
      if (B32.indexOf(c) < 0) break;
      chars.push(c);
    }
    const dec = n => { let bits = 0, v = 0; const o = []; for (let k = 0; k < n && k < chars.length; k++) { v = (v << 5) | B32.indexOf(chars[k]); bits += 5; if (bits >= 8) { o.push((v >>> (bits - 8)) & 255); bits -= 8; v &= 255; } } return o; };
    const head = dec(Math.ceil(11 * 8 / 5));
    if (head.length < 11 || head[0] !== 1 || head[10] > 40) return;
    const total = 11 + head[10] + 64, need = Math.ceil(total * 8 / 5);
    if (chars.length < need) return;
    const all = dec(need); if (all.length >= total) out.push(Uint8Array.from(all.slice(0, total)));
  });
  return out;
}
const parseLicenceKey = text => licenceCandidates(text)[0] || null;
const licenceCrypto = () => typeof crypto !== 'undefined' && crypto && crypto.subtle ? crypto.subtle : null;
/* { info, key } for the first candidate whose signature checks out, else null. Throws Error(LIC_MSG.noCrypto) when this page has no crypto.subtle. */
async function licenceCheck(text, pub = licencePub) {
  const cands = licenceCandidates(text); if (!cands.length) return null;
  const sub = licenceCrypto(); if (!sub) throw new Error(LIC_MSG.noCrypto);
  const key = await sub.importKey('raw', Uint8Array.from(atob(pub.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify']);
  for (const raw of cands) {
    const n = raw.length - 64;
    if (!(await sub.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, raw.slice(n), raw.slice(0, n)))) continue;
    const dv = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
    return { key: normLicenceKey(raw), info: { id: dv.getUint32(1), issued: licDate(dv.getUint16(5)), updatesUntil: licDate(dv.getUint16(7)), seats: raw[9], name: new TextDecoder().decode(raw.slice(11, 11 + raw[10])) } };
  }
  return null;
}
async function verifyLicence(text, pub = licencePub) { const r = await licenceCheck(text, pub); return r ? r.info : null; }
async function refreshLicence() {
  LIC.status = 'none'; LIC.info = null;
  try {
    const k = typeof S.settings.licence === 'string' ? S.settings.licence.trim() : '';
    if (!k) return LIC;
    const info = await verifyLicence(k);
    if (info) { LIC.status = 'valid'; LIC.info = info; } else LIC.status = 'invalid';
  } catch (e) { LIC.status = 'unchecked'; LIC.info = null; }
  return LIC;
}
const licensed = () => LIC.status === 'valid';
const licenceLine = () => licensed() ? 'Licensed to ' + LIC.info.name : EVAL_FOOTER;
const licenceLapsed = (today = todayISO()) => licensed() && today > LIC.info.updatesUntil;
const lapseText = () => 'Updates and support ended ' + fmtDate(LIC.info.updatesUntil) + '. Standards and defect lists may be out of date. ' + SELLER.contact + ' to renew.';
function storeLicence(text, info) {
  const raw = parseLicenceKey(text);
  S.settings.licence = raw ? normLicenceKey(raw) : String(text).trim();
  LIC.status = 'valid'; LIC.info = info;
  save();
}
/* result: 'ok' | 'renewed' | 'same' | 'confirm' | 'bad' | 'noCrypto'. 'confirm' stores nothing: the screen asks, then calls storeLicence(key, info). */
async function applyLicenceText(text) {
  await refreshLicence();
  let r;
  try { r = await licenceCheck(text); } catch (e) { return { result: 'noCrypto', info: null, current: licensed() ? LIC.info : null }; }
  const current = licensed() ? { ...LIC.info } : null;
  if (!r) return { result: 'bad', info: null, current };
  const out = (result) => ({ result, info: r.info, current, key: r.key });
  if (current && current.id === r.info.id) return out('same');
  if (!current) { storeLicence(r.key, r.info); return out('ok'); }
  const sameName = current.name.trim().toLowerCase() === r.info.name.trim().toLowerCase();
  if (sameName && r.info.updatesUntil >= current.updatesUntil) { storeLicence(r.key, r.info); return out('renewed'); }
  return out('confirm');
}

/* ---------- migrate: every default for older records, in one place. Safe to run twice. ---------- */
function migrate(rawSettings) {
  const st = S.settings;
  /* 1. simple defaults, only where the field is missing */
  if (st.tagStart === undefined) st.tagStart = 0;
  if (st.lastBackupAt === undefined) st.lastBackupAt = '';
  if (typeof st.licence !== 'string') st.licence = '';
  S.assets.forEach(a => { if (a.certNo === undefined) a.certNo = ''; });
  S.inspections.forEach(i => { if (!Array.isArray(i.actions)) i.actions = []; if (i.retest === undefined) i.retest = false; });
  S.visits.forEach(v => {
    if (!Array.isArray(v.revisions)) v.revisions = [];
    if (v.revReason === undefined) v.revReason = '';
    /* the old report printed the competency only when the visit's inspector was the Settings inspector */
    if (v.inspectorQuals === undefined) v.inspectorQuals = (st.inspector && v.inspector === st.inspector.name) ? (st.inspector.quals || '') : '';
  });
  /* signatures taken before 0.3.2 carry no key: fix them to the findings as they stand now */
  S.visits.forEach(v => { if (v.status === 'open') { if (v.signInspector && !v.signInspectorKey) v.signInspectorKey = sigKey(v, 'inspector'); if (v.signClient && !v.signClientKey) v.signClientKey = sigKey(v, 'client'); } });
  /* 2. freeze reports issued before snapshots existed, from the data as it stands now */
  S.visits.forEach(v => {
    if (v.status === 'issued' && !v.snapshot) { v.snapshot = makeSnapshot(v); v.snapshot.migrated = true; delete v.snapshot.licence; /* the licence line did not exist when these were issued */ }
    else if (v.snapshot === undefined) v.snapshot = null;
  });
  /* 3. gear not presented keeps the due date it already had (after the freeze, so frozen reports are untouched) */
  S.inspections.forEach(i => { if (i.result === 'missing' && !i.nextDue) i.nextDue = priorDue(i); });
  /* 4. A19: existing installs keep the intervals they had; new installs and sample data get the new defaults */
  if (rawSettings && rawSettings.intervalsV2 !== true && (S.assets.length || S.visits.length)) {
    Object.keys(OLD_MONTHS).forEach(id => {
      const o = st.types[id];
      if (!o || o.months === undefined) st.types[id] = { ...(o || {}), months: OLD_MONTHS[id] };
    });
  }
  st.intervalsV2 = true;
}
