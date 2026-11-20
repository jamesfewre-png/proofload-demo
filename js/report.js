'use strict';
/* Proofload reports: the inspection report document, file exports, backup, and sample data. */

const DOC_CSS = `
.doc { --ink:#17212B; --ink2:#4A5763; --line:#C7CFD6; --pass:#17794A; --fail:#BF261C; --repair:#9A5300; --missing:#515D69;
  background:#fff; color:var(--ink); max-width:820px; padding:38px 40px 30px; font:14.5px/1.45 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.doc * { box-sizing:border-box; }
.doc h2, .doc p, .doc dl, .doc dd, .doc dt { margin:0; }
.doc .dd { font-family:"DIN Alternate","Bahnschrift","Roboto Condensed","Arial Narrow",system-ui,sans-serif; font-stretch:88%; font-variant-numeric:tabular-nums; }
.doc-head { display:flex; justify-content:space-between; gap:24px; align-items:flex-start; padding-bottom:18px; border-bottom:3px solid var(--ink); }
.doc-co img { max-height:60px; max-width:210px; object-fit:contain; display:block; margin-bottom:8px; }
.doc-co b { display:block; font-size:19px; }
.doc-co span { display:block; color:var(--ink2); font-size:13px; }
.doc-title { text-align:right; }
.doc-title .kind { display:block; font-size:14px; font-weight:650; color:var(--ink2); max-width:16ch; margin-left:auto; line-height:1.25; }
.doc-title .no { display:block; font-size:34px; font-weight:700; line-height:1.1; margin-top:4px; white-space:nowrap; }
.doc-meta { display:grid; grid-template-columns:repeat(3,1fr); gap:14px 20px; margin:18px 0; }
.doc-meta dt { font-size:12.5px; color:var(--ink2); font-weight:650; }
.doc-meta dd { font-weight:650; }
.doc-tag { display:inline-flex; align-items:center; gap:7px; }
.doc-tag i { width:15px; height:15px; border-radius:3px; display:inline-block; box-shadow:inset 0 0 0 1.5px rgba(0,0,0,.2); }
.doc-sum { font-size:16.5px; font-weight:650; padding:14px 16px; background:#F1F4F6; border-left:6px solid var(--ink); margin-bottom:6px; }
.doc-scope { color:var(--ink2); margin-top:10px; }
.doc h2 { font-size:17px; font-weight:700; margin:26px 0 10px; }
.doc-act { border:1.5px solid var(--line); border-left:6px solid var(--fail); border-radius:4px; padding:12px 14px; margin-bottom:10px; break-inside:avoid; page-break-inside:avoid; }
.doc-act.repair { border-left-color:#D98A14; }
.doc-act.missing { border-left-color:#8A96A1; }
.doc-act .top { display:flex; justify-content:space-between; gap:12px; align-items:baseline; }
.doc-act .id { font-size:20px; font-weight:700; }
.doc-act .outcome { font-weight:700; white-space:nowrap; }
.doc-act .what { color:var(--ink2); font-size:13.5px; }
.doc-act ul { margin:8px 0 0; padding-left:20px; list-style:disc; }
.doc-act .ph { display:flex; flex-wrap:wrap; gap:8px; margin-top:10px; }
.doc-act .ph img { width:176px; height:132px; object-fit:cover; border-radius:3px; background:#F1F4F6; }
.doc table { width:100%; border-collapse:collapse; font-size:13px; }
.doc th { text-align:left; font-size:12px; color:var(--ink2); font-weight:700; padding:6px 8px 6px 0; border-bottom:1.5px solid var(--ink); vertical-align:bottom; }
.doc td { padding:7px 8px 7px 0; border-bottom:1px solid var(--line); vertical-align:top; }
.doc tr { break-inside:avoid; page-break-inside:avoid; }
.doc td.id { font-weight:700; font-size:14.5px; white-space:nowrap; }
.doc .r-pass { color:var(--pass); font-weight:700; } .doc .r-fail { color:var(--fail); font-weight:700; }
.doc .r-repair { color:var(--repair); font-weight:700; } .doc .r-missing { color:var(--missing); font-weight:700; }
.doc-sign { display:grid; grid-template-columns:1fr 1fr; gap:28px; margin-top:28px; break-inside:avoid; page-break-inside:avoid; }
.doc-sign .box { height:74px; border-bottom:1.5px solid var(--ink); display:flex; align-items:flex-end; }
.doc-sign img { max-height:70px; max-width:100%; }
.doc-sign b { display:block; margin-top:6px; }
.doc-sign span { display:block; color:var(--ink2); font-size:12.5px; }
.doc-foot { margin-top:26px; padding-top:12px; border-top:1px solid var(--line); color:var(--ink2); font-size:11.5px; line-height:1.45; }
@media (max-width:640px) { .doc { padding:22px 16px; } .doc-meta { grid-template-columns:1fr 1fr; } .doc-title .no { font-size:26px; }
  .doc table { font-size:12px; } .doc .col-opt { display:none; } .doc-sign { gap:16px; } }
`;

const reportNo = v => v.reportNo + (v.rev ? ' Rev ' + v.rev : '');

/* photoMap: null renders <img data-photo> for the live app; a Map renders embedded images for export. */
function reportDoc(v, photoMap) {
  const c = client(v.clientId), co = S.settings.company, n = counts(v.id), tag = TAGS[v.tag] || TAGS.yellow;
  const L = visitInsps(v.id).map(i => ({ i, a: asset(i.assetId) }));
  const img = p => photoMap ? (photoMap.get(p) ? `<img src="${photoMap.get(p)}" alt="Photo of the item">` : '') : `<img data-photo="${p}" alt="Photo of the item">`;
  const act = L.filter(x => x.i.result === 'fail' || x.i.result === 'repair' || x.i.result === 'missing');
  const sumBits = [];
  if (n.pass) sumBits.push(`${n.pass} passed and ${n.pass === 1 ? 'carries' : 'carry'} the ${tag.name.toLowerCase()} tag`);
  if (n.fail) sumBits.push(`${n.fail} failed and must be removed from service`);
  if (n.repair) sumBits.push(`${n.repair} ${n.repair === 1 ? 'needs' : 'need'} repair before use`);
  if (n.missing) sumBits.push(`${n.missing} ${n.missing === 1 ? 'was' : 'were'} not presented`);
  const coLines = [co.abn && 'ABN ' + co.abn, [co.phone, co.email].filter(Boolean).join(', '), co.address].filter(Boolean);

  return `<article class="doc">
    <header class="doc-head">
      <div class="doc-co">${co.logo ? `<img src="${co.logo}" alt="">` : ''}<b>${esc(co.name)}</b>${coLines.map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="doc-title"><span class="kind">Lifting equipment inspection report</span><span class="no dd">${esc(reportNo(v) || 'Draft')}</span></div>
    </header>
    <dl class="doc-meta">
      <div><dt>Client</dt><dd>${esc(c.name)}</dd></div>
      <div><dt>Site</dt><dd>${esc(c.site || 'Not recorded')}</dd></div>
      <div><dt>Site contact</dt><dd>${esc([c.contact, c.phone].filter(Boolean).join(', ') || 'Not recorded')}</dd></div>
      <div><dt>Inspection date</dt><dd>${fmtDate(v.date)}</dd></div>
      <div><dt>Inspector</dt><dd>${esc(v.inspector)}</dd></div>
      <div><dt>Tag applied to passed items</dt><dd><span class="doc-tag"><i style="background:${tag.hex}"></i>${tag.name}, ${quarterOf(v.date)}</span></dd></div>
    </dl>
    <p class="doc-sum">${plural(n.total, 'item')} inspected. ${esc(sumBits.join('. '))}${sumBits.length ? '.' : ''}</p>
    ${v.scope ? `<p class="doc-scope"><b>Scope.</b> ${esc(v.scope)}</p>` : ''}

    ${act.length ? `<h2>Items needing action</h2>${act.map(({ i, a }) => `<div class="doc-act ${i.result}">
        <div class="top"><span class="id dd">${esc(a.ident)}</span><span class="outcome r-${i.result}">${RESULTS[i.result].label}: ${RESULTS[i.result].long.toLowerCase()}</span></div>
        <div class="what">${esc([typeOf(a).name, a.desc, wllText(a), a.location].filter(Boolean).join(', '))}</div>
        ${i.defects.length ? `<ul>${i.defects.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        ${i.notes ? `<p style="margin-top:8px">${esc(i.notes)}</p>` : ''}
        ${(i.voice || []).length ? '<div class="what" style="margin-top:6px">Voice note recorded on site</div>' : ''}
        ${i.photos.length ? `<div class="ph">${i.photos.map(img).join('')}</div>` : ''}
      </div>`).join('')}` : ''}

    <h2>Register of items inspected</h2>
    <table>
      <thead><tr><th>ID or serial</th><th>Item</th><th>WLL</th><th class="col-opt">Kept at</th><th class="col-opt">Standard</th><th>Result</th><th>Next due</th></tr></thead>
      <tbody>${L.map(({ i, a }) => `<tr>
        <td class="id dd">${esc(a.ident)}</td>
        <td>${esc([typeOf(a).name, a.desc, a.make].filter(Boolean).join(', '))}</td>
        <td class="dd" style="white-space:nowrap">${esc(wllText(a).replace('WLL ', ''))}</td>
        <td class="col-opt">${esc(a.location)}</td>
        <td class="col-opt" style="white-space:nowrap">${esc(a.std)}</td>
        <td class="r-${i.result || 'missing'}">${i.result ? RESULTS[i.result].label : 'Not recorded'}</td>
        <td style="white-space:nowrap">${i.nextDue ? fmtDate(i.nextDue) : ''}</td>
      </tr>`).join('')}</tbody>
    </table>

    <div class="doc-sign">
      <div><div class="box">${v.signInspector ? `<img src="${v.signInspector}" alt="Inspector signature">` : ''}</div><b>${esc(v.inspector)}</b><span>Inspector${S.settings.inspector.quals && v.inspector === S.settings.inspector.name ? ', ' + esc(S.settings.inspector.quals) : ''}</span><span>${v.issuedAt ? 'Issued ' + fmtDate(v.issuedAt) : ''}</span></div>
      <div><div class="box">${v.signClient ? `<img src="${v.signClient}" alt="Client signature">` : ''}</div><b>${esc(v.clientRep || '')}</b><span>Received for ${esc(c.name)}</span></div>
    </div>
    <footer class="doc-foot">${esc(S.settings.disclaimer)}<br>Report ${esc(reportNo(v))}, prepared with Proofload.</footer>
  </article>`;
}

/* ---------- exports ---------- */
function download(name, mime, data) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name.replace(/[\\/:*?"<>|]+/g, ' ');
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
async function photoMapFor(ids) {
  const m = new Map();
  for (const id of ids) { let u = PH.get(id); if (!u) u = await DB.get('photos', id); if (u) m.set(id, u); }
  return m;
}
async function standaloneReport(v) {
  const ids = visitInsps(v.id).flatMap(i => i.photos);
  const map = await photoMapFor(ids);
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inspection report ${esc(reportNo(v))}</title><style>body{margin:0;padding:16px;background:#E7EBEE}.doc{margin:0 auto}${DOC_CSS}
@media print{body{background:#fff;padding:0}.doc{max-width:none;padding:0}@page{size:A4;margin:14mm}}</style></head><body>${reportDoc(v, map)}</body></html>`;
}
const reportFileName = (v, ext) => `${reportNo(v)} ${client(v.clientId).name}.${ext}`;
function registerCSV(v) {
  const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const rows = [['ID or serial', 'Type', 'Description', 'WLL', 'Unit', 'Make', 'Kept at', 'Standard', 'Result', 'Defects', 'Notes', 'Next due']];
  visitInsps(v.id).forEach(i => {
    const a = asset(i.assetId), t = typeOf(a);
    rows.push([a.ident, t.name, a.desc, t.wll ? a.wll : '', t.wll ? a.wllUnit : '', a.make, a.location, a.std, i.result ? RESULTS[i.result].label : '', i.defects.join('; '), i.notes, i.nextDue]);
  });
  return '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n');
}

/* ---------- backup and restore ---------- */
async function makeBackup() {
  const ids = S.inspections.flatMap(i => i.photos);
  const map = await photoMapFor(ids);
  const audio = {};
  for (const i of S.inspections) for (const n of (i.voice || [])) {
    const a = await DB.get('audio', n.audioId).catch(() => null);
    if (a && a.buf) audio[n.audioId] = { mime: a.mime, b64: b64enc(a.buf) };
  }
  return JSON.stringify({ app: 'proofload', version: APP.version, exportedAt: new Date().toISOString(), state: S, photos: Object.fromEntries(map), audio });
}
async function applyBackup(text) {
  const data = JSON.parse(text);
  if (!data || data.app !== 'proofload' || !data.state || !Array.isArray(data.state.visits)) throw new Error('This is not a Proofload backup file.');
  Voice.stopPlay();
  await DB.clear('photos'); await DB.clear('audio'); PH.clear();
  for (const [id, url] of Object.entries(data.photos || {})) await DB.put('photos', id, url);
  for (const [id, a] of Object.entries(data.audio || {})) await DB.put('audio', id, { mime: a.mime, buf: b64dec(a.b64) });
  const b = blankState();
  S = Object.assign(b, data.state);
  S.settings = Object.assign(blankState().settings, data.state.settings);
  normVoice();
  await saveNow();
  Voice.kick();
}

/* ---------- sample data, for looking around and for showing the app to someone ---------- */
const svgURL = svg => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
const demoPhoto = (type, caption) => svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#D5DBE0"/><rect y="430" width="800" height="170" fill="#B9C2CA"/><g transform="translate(250 90) scale(12.5)" fill="none" stroke="#3B4853" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${GLYPHS[type]}</g><rect x="0" y="540" width="800" height="60" fill="#17212B"/><text x="24" y="579" font-family="Arial, sans-serif" font-size="26" fill="#fff">Sample photo: ${caption}</text></svg>`);
const demoSign = seed => svgURL(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100"><path d="${seed ? 'M12 70C40 10 52 96 78 48S110 22 128 62s40-52 62-8 50 12 86-24' : 'M14 58c22-44 34 30 52-6s22-34 40 8 30-40 58-10 44 30 112-14'}" fill="none" stroke="#17212B" stroke-width="3" stroke-linecap="round"/></svg>`);

async function buildDemo() {
  Voice.stopPlay();
  const keepCo = S.settings.company.name.trim() ? S.settings.company : null;
  const keepIn = S.settings.inspector.name.trim() ? S.settings.inspector : null;
  await DB.clear('photos'); await DB.clear('audio'); PH.clear();
  S = blankState();
  S.settings.onboarded = true;
  S.settings.company = keepCo || { name: 'Swanline Lifting Inspections', abn: '00 000 000 000', phone: '08 0000 0000', email: 'office@example.com.au', address: 'Unit 4, 20 Example Street, Welshpool WA 6106', logo: '' };
  S.settings.inspector = keepIn || { name: 'Sam Taylor', quals: 'Lifting equipment inspector' };
  const who = S.settings.inspector.name, today = todayISO();

  const c1 = { id: 'c' + uid(), name: 'Brightwater Fabrication', site: 'Main workshop, Kewdale', contact: 'Dana Whitlock', email: '', phone: '0491 570 156' };
  const c2 = { id: 'c' + uid() + 'b', name: 'Tallow Street Crane Hire', site: 'Yard and service truck, Bibra Lake', contact: 'Marco Petrovic', email: '', phone: '(08) 5550 1234' };
  S.clients.push(c1, c2);
  const mk = (cid, type, ident, wll, desc, make, location) => { const a = newAsset(cid, type); Object.assign(a, { ident, wll, desc, make, location }); return a; };
  const rec = (v, a, result, extra = {}) => { const i = newInsp(v.id, a.id); if (result) setResult(i, result); Object.assign(i, extra); return i; };

  /* a visit issued about eleven months ago, so most of it is coming due */
  const d1 = addDays(today, -345);
  const v1 = newVisit(c1.id, d1, tagFor(d1), false);
  const soon = addDays(today, 20);
  rec(v1, mk(c1.id, 'chain', 'BF-CS-0141', '5.5', '2-leg, 10 mm, 3 m', 'Grade 80', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'chain', 'BF-CS-0142', '5.5', '2-leg, 10 mm, 3 m', 'Grade 80', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'shackle', 'BF-SH-2201', '4.75', 'Bow, 19 mm', '', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'shackle', 'BF-SH-2202', '4.75', 'Bow, 19 mm', '', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'hoist', 'BF-CB-0031', '1', 'Chain block, 3 m lift', '', 'Bay 2 monorail'), 'pass', { nextDue: addDays(today, 9) });
  rec(v1, mk(c1.id, 'clamp', 'BF-BC-0012', '2', '75 to 230 mm flange', '', 'Bay 2 monorail'), 'pass', { nextDue: addDays(today, 9) });
  rec(v1, mk(c1.id, 'harness', 'BF-HN-0107', '', 'Full body, size M-L', '', 'Stores'), 'pass', { nextDue: addDays(today, -4) });
  const pOld = 'p' + uid(); await DB.put('photos', pOld, demoPhoto('wire', 'broken wires near the ferrule'));
  const aOld = mk(c1.id, 'wire', 'BF-WR-0050', '2.1', '16 mm, 4 m, soft eyes', '', 'Bay 3');
  rec(v1, aOld, 'fail', { defects: ['Broken wires', 'Ferrule damage'], notes: 'Tagged out and handed to the workshop supervisor for disposal.', photos: [pOld] });
  aOld.retired = true;
  Object.assign(v1, { status: 'issued', reportNo: 'LR-0001', issuedAt: d1, inspector: who, clientRep: 'Dana Whitlock', signInspector: demoSign(0), signClient: demoSign(1), scope: 'All lifting gear in the main workshop.' });
  S.settings.nextNo = 2;

  /* a visit in progress today, deliberately left with gaps so the readiness check has something to say */
  const v2 = newVisit(c2.id, today, tagFor(today), false);
  v2.inspector = who; v2.scope = 'Lifting gear held in the yard store and on the service truck.';
  rec(v2, mk(c2.id, 'chain', 'TS-CS-01', '5.5', '2-leg, 10 mm, 3 m', 'Grade 80', 'Yard store'), 'pass');
  rec(v2, mk(c2.id, 'chain', 'TS-CS-02', '5.5', '2-leg, 10 mm, 3 m', 'Grade 80', 'Yard store'), 'pass');
  rec(v2, mk(c2.id, 'shackle', 'TS-SH-11', '4.75', 'Bow, 19 mm', '', 'Service truck'), 'pass');
  rec(v2, mk(c2.id, 'shackle', 'TS-SH-12', '4.75', 'Bow, 19 mm', '', 'Service truck'), 'pass');
  const p2 = 'p' + uid() + 'b'; await DB.put('photos', p2, demoPhoto('shackle', 'bent pin, wrong pin fitted'));
  rec(v2, mk(c2.id, 'shackle', 'TS-SH-13', '4.75', 'Bow, 19 mm', '', 'Service truck'), 'fail', { defects: ['Pin bent', 'Wrong pin fitted'], notes: 'Pin is not the original. Tagged out on site.', photos: [p2] });
  rec(v2, mk(c2.id, 'web', 'TS-WS-07', '2', '50 mm, 2 m', '', 'Yard store'), 'pass');
  rec(v2, mk(c2.id, 'hoist', 'TS-CB-02', '2', 'Chain block, 6 m lift', '', 'Yard store'), 'repair', { defects: ['Safety latch missing'] });
  rec(v2, mk(c2.id, 'beam', 'TS-SB-01', '10', '3 m, 2 lugs', '', 'Yard'), '');
  rec(v2, mk(c2.id, 'hoist', '', '', 'Lever hoist', '', 'Service truck'), '');
  S.visits.sort((a, b) => b.date.localeCompare(a.date));
  await saveNow();
}
