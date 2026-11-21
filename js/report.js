'use strict';
/* TagRound reports: the inspection report document, file exports, backup, and sample data. */

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
.doc-title .kind { display:block; font-size:14px; font-weight:650; color:var(--ink2); max-width:22ch; margin-left:auto; line-height:1.25; }
.doc-title .no { display:block; font-size:34px; font-weight:700; line-height:1.1; margin-top:4px; white-space:nowrap; }
.doc-meta { display:grid; grid-template-columns:repeat(3,1fr); gap:14px 20px; margin:18px 0; }
.doc-meta dt { font-size:12.5px; color:var(--ink2); font-weight:650; }
.doc-meta dd { font-weight:650; }
.doc-tag { display:inline-flex; align-items:center; gap:7px; }
.doc-tag i { width:15px; height:15px; border-radius:3px; display:inline-block; box-shadow:inset 0 0 0 1.5px #7A8692; }
.doc-sum { font-size:16.5px; font-weight:650; padding:14px 16px; background:#F1F4F6; border-left:6px solid var(--ink); margin-bottom:6px; }
.doc-scope { color:var(--ink2); margin-top:10px; }
.doc h2 { font-size:17px; font-weight:700; margin:26px 0 10px; }
.doc-act { border:1.5px solid var(--line); border-left:6px solid var(--fail); border-radius:4px; padding:12px 14px; margin-bottom:10px; break-inside:avoid; page-break-inside:avoid; }
.doc-act.repair { border-left-color:#9A5300; }
.doc-act.missing { border-left-color:#515D69; }
.doc-act .top { display:flex; justify-content:space-between; gap:12px; align-items:baseline; flex-wrap:wrap; }
.doc-act .id { font-size:20px; font-weight:700; white-space:nowrap; }
.doc-act .outcome { font-weight:700; white-space:normal; }
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

/* ---------- the report model: what a report prints, frozen at issue ---------- */
function makeSnapshot(v) {
  const c = client(v.clientId) || { name: '', site: '', contact: '', phone: '' }, co = S.settings.company, revs = v.revisions || [], last = revs[revs.length - 1];
  return {
    takenAt: new Date().toISOString(),
    title: visitInsps(v.id).some(i => ['harness', 'lanyard'].includes(asset(i.assetId).type)) ? 'Lifting and height safety equipment inspection report' : 'Lifting equipment inspection report',
    company: { name: co.name, abn: co.abn, phone: co.phone, email: co.email, address: co.address, logo: co.logo },
    client: { name: c.name, site: c.site, contact: c.contact, phone: c.phone },
    date: v.date, inspector: v.inspector, inspectorQuals: v.inspectorQuals ?? '',
    tag: v.tag, tagName: (TAGS[v.tag] || TAGS.yellow).name, tagPeriod: periodOf(v.date),
    scope: v.scope, clientRep: v.clientRep, signInspector: v.signInspector, signClient: v.signClient,
    issuedAt: v.issuedAt, reportNo: v.reportNo, rev: v.rev || 0, revReason: v.revReason || '',
    replaces: last ? { rev: last.rev, issuedAt: last.issuedAt } : null,
    disclaimer: S.settings.disclaimer,
    items: visitInsps(v.id).map(i => {
      const a = asset(i.assetId), t = typeOf(a);
      return { inspId: i.id, assetType: a.type, typeName: t.name, ident: a.ident, desc: a.desc,
        wll: t.wll ? a.wll : '', wllUnit: t.wll ? a.wllUnit : '', capLabel: t.cap ? 'Capacity' : 'WLL',
        make: a.make, certNo: a.certNo || '', location: a.location, std: a.std,
        result: i.result, defects: [...i.defects], actions: [...(i.actions || [])], retest: !!i.retest,
        notes: i.notes, photos: [...i.photos], nextDue: i.nextDue, lastPassed: lastPassedBefore(i) };
    })
  };
}
/* An issued report prints its snapshot; anything else is drawn from live data. */
const reportModel = v => (v.status === 'issued' && v.snapshot) ? v.snapshot : makeSnapshot(v);

/* The pure parts of issuing and revising, so they can be tested without the screen. */
function issueVisit(v) {
  if (!v.reportNo) v.reportNo = allocReportNo(); else v.rev = (v.rev || 0) + 1;
  v.status = 'issued'; v.issuedAt = todayISO();
  v.snapshot = makeSnapshot(v);
  /* destroyed gear leaves the active register; revising never puts it back */
  let n = 0;
  visitInsps(v.id).forEach(i => { const a = asset(i.assetId); if (i.result === 'fail' && (i.actions || []).includes('Destroyed on site') && a && !a.retired) { a.retired = true; n++; } });
  return n;
}
const reasonOk = r => String(r || '').replace(/\s/g, '').length >= 3;
function reviseVisit(v, reason) {
  if (!reasonOk(reason)) return false;
  if (!Array.isArray(v.revisions)) v.revisions = [];
  v.revisions.push({ rev: v.rev || 0, reportNo: reportNo(v), issuedAt: v.issuedAt, snapshot: v.snapshot || makeSnapshot(v) });
  v.revReason = String(reason).trim(); v.snapshot = null; v.signInspector = ''; v.signClient = ''; v.status = 'open';
  return true;
}

/* Renders only from the model m. photoMap: null renders <img data-photo> for the live app; a Map renders embedded images for export.
   opts.superseded marks an earlier version. */
const docWllVal = x => String(x.wll).trim() ? x.wll + ' ' + x.wllUnit : '';
const docWll = x => docWllVal(x) ? (x.capLabel || 'WLL') + ' ' + docWllVal(x) : '';
const docCert = x => x.certNo ? 'Certificate ' + x.certNo : '';
function renderDoc(m, photoMap, opts = {}) {
  const co = m.company, c = m.client, tag = TAGS[m.tag] || TAGS.yellow;
  const n = { total: m.items.length, pass: 0, fail: 0, repair: 0, missing: 0 };
  m.items.forEach(x => { if (x.result in n) n[x.result]++; });
  const img = p => photoMap ? (photoMap.get(p) ? `<img src="${photoMap.get(p)}" alt="Photo of the item">` : '') : `<img data-photo="${p}" alt="Photo of the item">`;
  const act = m.items.filter(x => x.result === 'fail' || x.result === 'repair' || x.result === 'missing');
  const sumBits = [];
  if (n.pass) sumBits.push(`${n.pass} passed and ${n.pass === 1 ? 'carries' : 'carry'} the ${m.tagName.toLowerCase()} tag`);
  if (n.fail) sumBits.push(`${n.fail} ${n.fail === 1 ? 'failed and is' : 'failed and are'} withdrawn from service`);
  if (n.repair) sumBits.push(`${n.repair} ${n.repair === 1 ? 'needs' : 'need'} repair and must not be used until repaired and re-inspected`);
  if (n.missing) sumBits.push(`${n.missing} ${n.missing === 1 ? 'was' : 'were'} not presented`);
  const coLines = [co.abn && 'ABN ' + co.abn, [co.phone, co.email].filter(Boolean).join(', '), co.address].filter(Boolean);
  const overdue = x => !!x.nextDue && x.nextDue < m.date;
  const missingLine = x => (x.lastPassed ? `Last passed ${fmtDate(x.lastPassed)}.` + (x.nextDue ? ` Due ${fmtDate(x.nextDue)}.` : '') : x.nextDue ? `Due ${fmtDate(x.nextDue)}.` : 'No earlier inspection on record.') + (overdue(x) ? ' Overdue.' : '');
  const nextDueCell = x => x.result === 'repair' ? (x.retest ? 'After repair and proof load test' : 'After repair') : x.result === 'fail' ? 'Withdrawn' : x.result === 'missing' ? (x.nextDue ? fmtDate(x.nextDue) + (overdue(x) ? ' (overdue)' : '') : 'Not known') : (x.nextDue ? fmtDate(x.nextDue) : '');
  const OUTCOME = { fail: 'Fail. Withdrawn from service', repair: 'Repair. Do not use until repaired and re-inspected', missing: 'Not presented. Not sighted at this inspection' };
  const sup = opts.superseded ? '<span style="display:block;color:#BF261C;font-size:14px;font-weight:700;margin-top:4px">SUPERSEDED</span>' : '';
  const reason = String(m.revReason || '').trim();
  const rep = m.replaces ? `<span style="display:block;font-size:13px;color:#4A5763;margin:4px 0 0 auto;max-width:44ch;line-height:1.35">Rev ${opts.draft ? m.rev + 1 : m.rev}. Replaces the report issued ${fmtDate(m.replaces.issuedAt)}. Reason: ${esc(reason)}${/[.!?]$/.test(reason) ? '' : '.'}</span>` : '';

  return `<article class="doc">
    <header class="doc-head">
      <div class="doc-co">${co.logo ? `<img src="${co.logo}" alt="">` : ''}<b>${esc(co.name)}</b>${coLines.map(x => `<span>${esc(x)}</span>`).join('')}</div>
      <div class="doc-title"><span class="kind">${esc(m.title)}</span>${sup}${opts.draft ? '<span class="no dd" style="color:#BF261C">DRAFT</span><span style="display:block;font-size:14px;font-weight:650;color:#4A5763">Not issued</span>' : `<span class="no dd">${esc(reportNo(m) || 'Draft')}</span>`}${rep}</div>
    </header>
    <dl class="doc-meta">
      <div><dt>Client</dt><dd>${esc(c.name)}</dd></div>
      <div><dt>Site</dt><dd>${esc(c.site || 'Not recorded')}</dd></div>
      <div><dt>Site contact</dt><dd>${esc([c.contact, c.phone].filter(Boolean).join(', ') || 'Not recorded')}</dd></div>
      <div><dt>Inspection date</dt><dd>${fmtDate(m.date)}</dd></div>
      <div><dt>Inspector</dt><dd>${esc(m.inspector)}</dd></div>
      <div><dt>Tag applied to passed items</dt><dd><span class="doc-tag"><i style="background:${tag.hex}"></i>${m.tagName}, ${m.tagPeriod}</span></dd></div>
    </dl>
    <p class="doc-sum">${plural(n.total, 'item')} inspected. ${esc(sumBits.join('. '))}${sumBits.length ? '.' : ''}</p>
    ${m.scope ? `<p class="doc-scope"><b>Scope.</b> ${esc(m.scope)}</p>` : ''}

    ${act.length ? `<h2>Items needing action</h2>${act.map(x => `<div class="doc-act ${x.result}">
        <div class="top"><span class="id dd">${esc(x.ident)}</span><span class="outcome r-${x.result}">${OUTCOME[x.result]}</span></div>
        <div class="what">${esc([x.typeName, x.desc, docWll(x), x.location, docCert(x)].filter(Boolean).join(', '))}</div>${x.result === 'missing' ? `
        <p class="what" style="margin-top:6px">${esc(missingLine(x))}</p>` : ''}
        ${x.defects.length ? `<ul>${x.defects.map(d => `<li>${esc(d)}</li>`).join('')}</ul>` : ''}
        ${x.notes ? `<p style="margin-top:8px">${esc(x.notes)}</p>` : ''}
        ${(x.actions || []).length ? `<p style="margin-top:8px">Action taken: ${esc(actionText(x.actions))}</p>` : ''}
        ${x.result === 'repair' && x.retest ? '<p style="margin-top:8px;font-weight:700">Proof load test needed after repair, before it goes back into service.</p>' : ''}
        ${x.photos.length ? `<div class="ph">${x.photos.map(img).join('')}</div>` : ''}
      </div>`).join('')}` : ''}

    <h2>Register of items inspected</h2>
    <table>
      <thead><tr><th>ID or serial</th><th>Item</th><th>WLL or capacity</th><th class="col-opt">Kept at</th><th class="col-opt">Standard</th><th>Result</th><th>Next due</th></tr></thead>
      <tbody>${m.items.map(x => `<tr>
        <td class="id dd">${esc(x.ident)}</td>
        <td>${esc([x.typeName, x.desc, x.make, docCert(x)].filter(Boolean).join(', '))}${(x.result === 'pass' || x.result === 'missing') && String(x.notes || '').trim() ? `<div style="font-size:12.5px;color:#4A5763">Note: ${esc(x.notes)}</div>` : ''}</td>
        <td class="dd" style="white-space:nowrap">${esc(docWllVal(x))}</td>
        <td class="col-opt">${esc(x.location)}</td>
        <td class="col-opt" style="white-space:nowrap">${esc(x.std)}</td>
        <td class="r-${x.result || 'missing'}">${x.result ? RESULTS[x.result].label : 'Not recorded'}</td>
        <td style="white-space:nowrap">${nextDueCell(x)}</td>
      </tr>`).join('')}</tbody>
    </table>
    ${n.pass ? `<p style="font-size:12.5px;color:#4A5763;margin:8px 0 0">Items that passed carry the ${esc(m.tagName.toLowerCase())} tag for ${esc(m.tagPeriod)}. Next due is the date by which each item must be inspected again, whatever its tag colour.</p>` : ''}

    <div class="doc-sign">
      <div><div class="box">${m.signInspector ? `<img src="${m.signInspector}" alt="Inspector signature">` : ''}</div><b>${esc(m.inspector)}</b><span>Inspector</span>${String(m.inspectorQuals || '').trim() ? `<span>Competency: ${esc(m.inspectorQuals)}</span>` : ''}<span>${m.issuedAt ? 'Issued ' + fmtDate(m.issuedAt) : ''}</span></div>
      <div><div class="box">${m.signClient ? `<img src="${m.signClient}" alt="Client signature">` : ''}</div><b>${esc(m.clientRep || '')}</b><span>${m.signClient ? 'Received for ' + esc(c.name) : 'Not signed by the client'}</span></div>
    </div>
    <footer class="doc-foot"><p style="font-size:12px;font-weight:700;color:#17212B;margin-bottom:8px">This is a periodic inspection record. It is not a proof load test certificate. Any proof load test referred to was carried out separately, under its own certificate.</p>${esc(m.disclaimer)}<br>${opts.draft ? 'Draft' : 'Report ' + esc(reportNo(m))}, prepared with TagRound.</footer>
  </article>`;
}
/* Page marks for printing: report number and business bottom left, page count bottom right. */
const cssStr = x => String(x ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"');
const pageMarksCSS = m => `@page { size: A4; margin: 14mm 14mm 16mm; @bottom-left { content: "Report ${cssStr(reportNo(m))}, ${cssStr(m.company.name)}"; font: 9pt system-ui, sans-serif; color: #4A5763; } @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 9pt system-ui, sans-serif; color: #4A5763; } }`;
const reportDoc = (v, photoMap, opts) => renderDoc(reportModel(v), photoMap, opts);

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
  const m = reportModel(v), map = await photoMapFor(m.items.flatMap(x => x.photos));
  return `<!doctype html><html lang="en-AU"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inspection report ${esc(reportNo(m))}</title><style>body{margin:0;padding:16px;background:#E7EBEE}.doc{margin:0 auto}${DOC_CSS}
@media print{body{background:#fff;padding:0}.doc{max-width:none;padding:0}}${pageMarksCSS(m)}</style></head><body>${renderDoc(m, map)}</body></html>`;
}
const reportFileName = (v, ext) => { const m = reportModel(v); return `${reportNo(m)} ${m.client.name}.${ext}`; };
function registerCSV(v) {
  const q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
  const rows = [['ID or serial', 'Type', 'Description', 'WLL', 'Unit', 'Manufacturer', 'Test certificate', 'Kept at', 'Standard', 'Result', 'Defects', 'Action taken', 'Proof load test after repair', 'Notes', 'Next due']];
  reportModel(v).items.forEach(x => {
    rows.push([x.ident, x.typeName, x.desc, x.wll, x.wllUnit, x.make, x.certNo || '', x.location, x.std, x.result ? RESULTS[x.result].label : '', x.defects.join('; '), (x.actions || []).join('; '), x.retest ? 'Yes' : '', x.notes, x.nextDue]);
  });
  return '﻿' + rows.map(r => r.map(q).join(',')).join('\r\n');
}

/* ---------- backup and restore ---------- */
async function makeBackup() {
  /* photos of earlier versions stay in the backup even when they are no longer on the live visit */
  const ids = S.inspections.flatMap(i => i.photos).concat(S.visits.flatMap(snapshotPhotoIds));
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
  if (!data || data.app !== 'proofload' || !data.state || !Array.isArray(data.state.visits)) throw new Error('This is not a TagRound backup file.');
  Voice.stopPlay();
  await DB.clear('photos'); await DB.clear('audio'); PH.clear();
  for (const [id, url] of Object.entries(data.photos || {})) await DB.put('photos', id, url);
  for (const [id, a] of Object.entries(data.audio || {})) await DB.put('audio', id, { mime: a.mime, buf: b64dec(a.b64) });
  const b = blankState();
  S = Object.assign(b, data.state);
  S.settings = Object.assign(blankState().settings, data.state.settings);
  migrate(data.state.settings);
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
  S.settings.inspector = keepIn || { name: 'Sam Taylor', quals: 'Intermediate rigging licence (HRW)' };
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
  rec(v1, mk(c1.id, 'chain', 'BF-CS-0141', '5.5', '2-leg, 10 mm, Grade T(80), 3 m', '', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'chain', 'BF-CS-0142', '5.5', '2-leg, 10 mm, Grade T(80), 3 m', '', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'shackle', 'BF-SH-2201', '4.75', 'Bow, 19 mm', '', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'shackle', 'BF-SH-2202', '4.75', 'Bow, 19 mm', '', 'Bay 1 rack'), 'pass', { nextDue: soon });
  rec(v1, mk(c1.id, 'hoist', 'BF-CB-0031', '1', 'Chain block, 3 m lift', '', 'Bay 2 monorail'), 'pass', { nextDue: addDays(today, 9) });
  rec(v1, mk(c1.id, 'clamp', 'BF-BC-0012', '2', '75 to 230 mm flange', '', 'Bay 2 monorail'), 'pass', { nextDue: addDays(today, 9) });
  rec(v1, mk(c1.id, 'harness', 'BF-HN-0107', '', 'Full body, size M-L', '', 'Stores'), 'pass', { nextDue: addDays(today, -4) });
  const pOld = 'p' + uid(); await DB.put('photos', pOld, demoPhoto('wire', 'broken wires near the ferrule'));
  const aOld = mk(c1.id, 'wire', 'BF-WR-0050', '2.1', '16 mm, 4 m, soft eyes', '', 'Bay 3');
  rec(v1, aOld, 'fail', { defects: ['Broken wires', 'Ferrule damage'], notes: 'Tagged out and handed to the workshop supervisor for disposal.', photos: [pOld], actions: ['Danger tag fitted', 'Quarantined on site'] });
  aOld.retired = true;
  Object.assign(v1, { status: 'issued', reportNo: 'LR-0001', issuedAt: d1, inspector: who, clientRep: 'Dana Whitlock', signInspector: demoSign(0), signClient: demoSign(1), scope: 'All lifting gear in the main workshop.' });
  S.settings.nextNo = 2;

  /* a visit in progress today, deliberately left with gaps so the readiness check has something to say */
  const v2 = newVisit(c2.id, today, tagFor(today), false);
  v2.inspector = who; v2.scope = 'Lifting gear held in the yard store and on the service truck.';
  rec(v2, Object.assign(mk(c2.id, 'chain', 'TS-CS-01', '5.5', '2-leg, 10 mm, Grade T(80), 3 m', '', 'Yard store'), { certNo: 'TC 48213' }), 'pass');
  rec(v2, mk(c2.id, 'chain', 'TS-CS-02', '5.5', '2-leg, 10 mm, Grade T(80), 3 m', '', 'Yard store'), 'pass');
  rec(v2, mk(c2.id, 'shackle', 'TS-SH-11', '4.75', 'Bow, 19 mm', '', 'Service truck'), 'pass');
  rec(v2, mk(c2.id, 'shackle', 'TS-SH-12', '4.75', 'Bow, 19 mm', '', 'Service truck'), 'pass');
  const p2 = 'p' + uid() + 'b'; await DB.put('photos', p2, demoPhoto('shackle', 'bent pin, wrong pin fitted'));
  rec(v2, mk(c2.id, 'shackle', 'TS-SH-13', '4.75', 'Bow, 19 mm', '', 'Service truck'), 'fail', { defects: ['Pin bent', 'Wrong pin fitted'], notes: 'Pin is not the original. Tagged out on site.', photos: [p2], actions: ['Danger tag fitted', 'Quarantined on site'] });
  rec(v2, Object.assign(mk(c2.id, 'web', 'TS-WS-07', '2', '50 mm, 2 m', '', 'Yard store'), { certNo: 'WS 7701' }), 'pass');
  rec(v2, mk(c2.id, 'hoist', 'TS-CB-02', '2', 'Chain block, 6 m lift', '', 'Yard store'), 'repair', { defects: ['Safety latch missing'], actions: ['Danger tag fitted', 'Sent for repair'] });
  rec(v2, mk(c2.id, 'beam', 'TS-SB-01', '10', '3 m, 2 lugs', '', 'Yard'), '');
  rec(v2, mk(c2.id, 'hoist', '', '', 'Lever hoist', '', 'Service truck'), '');
  S.visits.sort((a, b) => b.date.localeCompare(a.date));
  migrate(null);
  await saveNow();
}
