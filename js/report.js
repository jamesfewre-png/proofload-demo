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
.doc-lic { margin-top:12px; font-size:11.5px; color:var(--ink2); }
.doc-lic.eval { margin-top:14px; padding:10px 14px; border:2px solid #9A5300; border-radius:6px; background:#FFF0D9; color:#17212B; font-size:14px; font-weight:700; text-align:center; break-inside:avoid; page-break-inside:avoid; }
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
    licence: licenceLine(),   /* frozen with the report: the footer it was issued with. Not part of the signed findings. */
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
  v.revReason = String(reason).trim(); v.snapshot = null; v.signInspector = ''; v.signClient = ''; v.signInspectorKey = ''; v.signClientKey = ''; v.status = 'open';
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
    ${m.licence ? `<div class="doc-lic${/^Licensed to /.test(m.licence) ? '' : ' eval'}">${esc(m.licence)}</div>` : ''}
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
  await refreshLicence();
  const deviceKey = licensed() ? S.settings.licence : '';
  await DB.clear('photos'); await DB.clear('audio'); PH.clear();
  for (const [id, url] of Object.entries(data.photos || {})) await DB.put('photos', id, url);
  for (const [id, a] of Object.entries(data.audio || {})) await DB.put('audio', id, { mime: a.mime, buf: b64dec(a.b64) });
  const b = blankState();
  S = Object.assign(b, data.state);
  S.settings = Object.assign(blankState().settings, data.state.settings);
  migrate(data.state.settings);
  normVoice();
  /* the licence travels in the backup; a backup with no valid key never removes a valid key already on this device */
  await refreshLicence();
  if (deviceKey && (LIC.status === 'none' || LIC.status === 'invalid')) { S.settings.licence = deviceKey; await refreshLicence(); }
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
  const keepLic = S.settings.licence || '';
  await DB.clear('photos'); await DB.clear('audio'); PH.clear();
  S = blankState();
  S.settings.onboarded = true;
  S.settings.licence = keepLic;
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
  v1.snapshot = makeSnapshot(v1);   /* the sample's issued report is frozen now, so it carries the current licence footer */

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

/* ---------- spreadsheet import: read, match, check. Everything happens on this device. ---------- */
const IMPORT_MSG = {
  xls: 'This is an older Excel file (.xls). Save as CSV in Excel and import that.',
  noInflate: 'This browser cannot open Excel files. Save as CSV in Excel and import that.',
  badXlsx: 'This Excel file could not be read. Save as CSV in Excel and import that.',
  notSheet: 'This is not a spreadsheet. Choose a CSV or Excel (.xlsx) file.',
  empty: 'No rows found in this file.',
  tooBig: 'This file is too big to import (over 10 MB).'
};
const IMPORT_MAX_BYTES = 10 * 1024 * 1024, IMPORT_MAX_ROWS = 5000;
const importErr = k => new Error(IMPORT_MSG[k]);
const reEsc = s => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const importCell = v => String(v == null ? '' : v).trim();
const importHasContent = rows => rows.some(r => r.some(c => importCell(c) !== ''));

/* CSV: BOM, CRLF/LF/CR, delimiter by consistency over the first lines (comma, semicolon or tab), quoted fields. */
function parseCSV(text) {
  text = String(text == null ? '' : text).replace(/^﻿/, '');
  const DELIMS = [',', ';', '\t'];
  /* count each delimiter outside quotes, line by line, for the first ten non-empty lines */
  const counts = DELIMS.map(() => []);
  let cur = DELIMS.map(() => 0), inQ = false, lines = 0, hasText = false;
  for (let i = 0; i < text.length && lines < 10; i++) {
    const ch = text[i];
    if (ch === '"') { inQ = !inQ; hasText = true; continue; }
    if (!inQ && (ch === '\n' || ch === '\r')) {
      if (hasText) { DELIMS.forEach((d, k) => counts[k].push(cur[k])); lines++; }
      cur = DELIMS.map(() => 0); hasText = false; continue;
    }
    if (!inQ) { const k = DELIMS.indexOf(ch); if (k >= 0) cur[k]++; }
    if (!/\s/.test(ch)) hasText = true;
  }
  if (hasText && lines < 10) DELIMS.forEach((d, k) => counts[k].push(cur[k]));
  let delim = ',', best = 0;
  counts.forEach((c, k) => {
    const nz = c.filter(n => n > 0); if (!nz.length) return;
    const freq = {}; nz.forEach(n => { freq[n] = (freq[n] || 0) + 1; });
    const score = Math.max(...Object.values(freq));
    if (score > best) { best = score; delim = DELIMS[k]; }
  });
  const rows = []; let row = [], buf = '', q = false, was = false, any = false;
  const endCell = () => { row.push(was ? buf : buf.trim()); buf = ''; was = false; any = true; };
  const endRow = () => { endCell(); rows.push(row); row = []; any = false; };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { buf += '"'; i++; } else q = false; } else buf += ch;
    } else if (ch === '"' && !was && buf.trim() === '') { q = true; was = true; buf = ''; }
    else if (ch === delim) endCell();
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; endRow(); }
    else if (was) { if (!/\s/.test(ch)) buf += ch; } /* text after a closing quote is kept, spaces are not */
    else buf += ch;
  }
  if (any || buf !== '' || was) endRow();
  while (rows.length && rows[rows.length - 1].every(c => c === '')) rows.pop();
  return rows;
}

/* ---- xlsx without libraries: zip directory, deflate by DecompressionStream, then the few XML parts we need ---- */
async function importInflate(data) {
  if (typeof DecompressionStream === 'undefined') throw importErr('noInflate');
  const out = await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer();
  return new Uint8Array(out);
}
const importAttrs = s => { const o = {}, re = /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g; let m; while ((m = re.exec(s))) o[m[1]] = m[2] !== undefined ? m[2] : m[3]; return o; };
function xmlDecode(s) {
  return String(s).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos);/gi, (m, e) => {
    e = e.toLowerCase();
    if (e === 'amp') return '&'; if (e === 'lt') return '<'; if (e === 'gt') return '>'; if (e === 'quot') return '"'; if (e === 'apos') return "'";
    const n = e[1] === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    try { return String.fromCodePoint(n); } catch (x) { return ''; }
  }).replace(/_x([0-9A-Fa-f]{4})_/g, (m, h) => String.fromCharCode(parseInt(h, 16)));
}
/* the text of an <si> or <is> block: all <t> runs joined, phonetic runs ignored */
function importRuns(xml) {
  xml = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '', m; const re = /<t(?:\s[^>\/]*)?>([\s\S]*?)<\/t>/g;
  while ((m = re.exec(xml))) out += xmlDecode(m[1]);
  return out;
}
const importColIndex = ref => { const m = /^([A-Za-z]+)/.exec(ref || ''); if (!m) return -1; let n = 0; for (const ch of m[1].toUpperCase()) n = n * 26 + ch.charCodeAt(0) - 64; return n - 1; };
const importTidy = v => { const n = parseFloat(v); return isFinite(n) && /^\s*-?[\d.]+(e[+-]?\d+)?\s*$/i.test(v) ? String(Number(n.toPrecision(15))) : v; };
function importSheetRows(xml, shared) {
  const sd = /<sheetData\b[^>]*?(?:\/>|>([\s\S]*?)<\/sheetData>)/.exec(xml);
  if (!sd) throw importErr('badXlsx');
  const rows = []; if (!sd[1]) return rows;
  const rowRe = /<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g; let rm, next = 0;
  while ((rm = rowRe.exec(sd[1]))) {
    const ra = importAttrs(rm[1]); let ri = ra.r ? parseInt(ra.r, 10) - 1 : next; if (!(ri >= 0)) ri = next; next = ri + 1;
    if (ri > 60000) continue;
    const cells = []; let cn = 0;
    if (rm[2]) {
      const cRe = /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g; let cm;
      while ((cm = cRe.exec(rm[2]))) {
        const ca = importAttrs(cm[1]); let ci = ca.r ? importColIndex(ca.r) : cn; if (ci < 0) ci = cn; cn = ci + 1;
        if (ci > 300) continue;
        const t = ca.t || 'n', body = cm[2] || '';
        let val = '';
        if (t === 'inlineStr') val = importRuns(body);
        else {
          const vm = /<v(?:\s[^>\/]*)?>([\s\S]*?)<\/v>/.exec(body), v = vm ? xmlDecode(vm[1]) : '';
          if (t === 's') val = v === '' ? '' : (shared[parseInt(v, 10)] ?? '');
          else if (t === 'b') val = v === '' ? '' : (v.trim() === '1' ? 'TRUE' : 'FALSE');
          else if (t === 'n') val = importTidy(v);
          else val = v;
        }
        cells[ci] = val;
      }
    }
    rows[ri] = Array.from(cells, x => x === undefined ? '' : x);
  }
  for (let i = 0; i < rows.length; i++) if (!rows[i]) rows[i] = [];
  while (rows.length && rows[rows.length - 1].every(c => importCell(c) === '')) rows.pop();
  return rows;
}
async function importReadXlsx(bytes, inflate) {
  try {
    const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), n = bytes.length;
    let eocd = -1;
    for (let i = n - 22; i >= Math.max(0, n - 22 - 65535); i--) if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
    if (eocd < 0) throw importErr('badXlsx');
    const count = dv.getUint16(eocd + 10, true), cdOff = dv.getUint32(eocd + 16, true);
    if (cdOff >= n || count > 5000) throw importErr('badXlsx');
    const dec = new TextDecoder('utf-8'), entries = new Map(); let p = cdOff;
    for (let k = 0; k < count; k++) {
      if (p + 46 > n || dv.getUint32(p, true) !== 0x02014b50) throw importErr('badXlsx');
      const method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true), usize = dv.getUint32(p + 24, true);
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      if (p + 46 + nl > n) throw importErr('badXlsx');
      entries.set(dec.decode(bytes.subarray(p + 46, p + 46 + nl)).toLowerCase(), { method, csize, usize, off });
      p += 46 + nl + el + cl;
    }
    const get = async name => {
      const e = entries.get(String(name).toLowerCase()); if (!e) return null;
      if (e.usize > 64 * 1024 * 1024 || e.off + 30 > n || dv.getUint32(e.off, true) !== 0x04034b50) throw importErr('badXlsx');
      const start = e.off + 30 + dv.getUint16(e.off + 26, true) + dv.getUint16(e.off + 28, true);
      if (start + e.csize > n) throw importErr('badXlsx');
      const raw = bytes.subarray(start, start + e.csize);
      if (e.method === 0) return raw;
      if (e.method !== 8) throw importErr('badXlsx');
      const out = await (inflate || importInflate)(raw);
      if (e.usize && out.length !== e.usize) throw importErr('badXlsx');
      return out;
    };
    const txt = async name => { const d = await get(name); return d ? dec.decode(d).replace(/^﻿/, '') : null; };
    const wb = await txt('xl/workbook.xml'); if (wb == null) throw importErr('badXlsx');
    const rels = await txt('xl/_rels/workbook.xml.rels'), relMap = {};
    if (rels) { let m; const re = /<Relationship\b([^>]*?)\/?>/g; while ((m = re.exec(rels))) { const a = importAttrs(m[1]); if (a.Id && a.Target) relMap[a.Id] = a.Target; } }
    const ss = await txt('xl/sharedStrings.xml'), shared = [];
    if (ss) { let m; const re = /<si(?:\s[^>]*?)?(?:\/>|>([\s\S]*?)<\/si>)/g; while ((m = re.exec(ss))) shared.push(m[1] ? importRuns(m[1]) : ''); }
    const sheets = []; let sm, si = 0; const sre = /<sheet\b([^>]*?)\/?>/g;
    while ((sm = sre.exec(wb))) {
      const a = importAttrs(sm[1]), rid = a['r:id'] || Object.keys(a).filter(k => /:id$/.test(k)).map(k => a[k])[0];
      si++;
      const target = rid && relMap[rid] ? relMap[rid].replace(/\\/g, '/') : 'worksheets/sheet' + si + '.xml';
      let path; if (target[0] === '/') path = target.slice(1); else { const o = []; ('xl/' + target).split('/').forEach(s => { if (s === '..') o.pop(); else if (s && s !== '.') o.push(s); }); path = o.join('/'); }
      const xml = await txt(path);
      if (xml == null) { if (/chartsheet/i.test(path)) continue; throw importErr('badXlsx'); }
      sheets.push({ name: xmlDecode(a.name || 'Sheet' + si), rows: importSheetRows(xml, shared) });
    }
    if (!sheets.length) throw importErr('badXlsx');
    return sheets;
  } catch (e) {
    if (Object.values(IMPORT_MSG).includes(e.message)) throw e;
    throw importErr('badXlsx');
  }
}
/* Read a CSV or xlsx file already in memory. The kind is decided by the first bytes, never the file name. */
async function readSpreadsheet(bytes, fileName, inflate) {
  if (bytes.length > IMPORT_MAX_BYTES) throw importErr('tooBig');
  const b = i => bytes[i];
  let sheets;
  if (b(0) === 0x50 && b(1) === 0x4B && b(2) === 3 && b(3) === 4) sheets = await importReadXlsx(bytes, inflate);
  else if (b(0) === 0xD0 && b(1) === 0xCF && b(2) === 0x11 && b(3) === 0xE0) throw importErr('xls');
  else if ((b(0) === 0x25 && b(1) === 0x50 && b(2) === 0x44 && b(3) === 0x46) || (b(0) === 0x89 && b(1) === 0x50 && b(2) === 0x4E && b(3) === 0x47) ||
    (b(0) === 0xFF && b(1) === 0xD8 && b(2) === 0xFF) || (b(0) === 0x47 && b(1) === 0x49 && b(2) === 0x46 && b(3) === 0x38)) throw importErr('notSheet');
  else {
    let text;
    if (b(0) === 0xFF && b(1) === 0xFE) text = new TextDecoder('utf-16le').decode(bytes);        /* Excel "Unicode text" */
    else if (b(0) === 0xFE && b(1) === 0xFF) text = new TextDecoder('utf-16be').decode(bytes);
    else {
      if (bytes.subarray(0, 4096).includes(0)) throw importErr('notSheet');                        /* binary, not text */
      try { text = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch (e) { text = new TextDecoder('windows-1252').decode(bytes); }
    }
    sheets = [{ name: String(fileName || 'Sheet').replace(/^.*[\\\/]/, '').replace(/\.[^.]*$/, '') || 'Sheet', rows: parseCSV(text) }];
  }
  if (!sheets.some(s => importHasContent(s.rows))) throw importErr('empty');
  return { sheets };
}

/* ---- column matching ---- */
const IMPORT_SYN = {
  ident: ['id', 'serial', 'serial no', 'serial number', 's/n', 'sn', 'asset', 'asset no', 'asset number', 'asset id', 'tag', 'tag no', 'tag number', 'id no', 'id number', 'item no', 'item number', 'plant no', 'plant number', 'identification', 'id or serial', 'id or serial number', 'unique id'],
  wll: ['wll', 'swl', 'capacity', 'rated capacity', 'load', 'working load limit', 'safe working load', 'wll swl', 'max load'],
  unit: ['unit', 'units', 'wll unit', 'swl unit'],
  desc: ['description', 'item', 'equipment', 'details', 'item description', 'equipment description', 'desc'],
  type: ['type', 'category', 'equipment type', 'item type', 'gear type', 'class'],
  make: ['make', 'manufacturer', 'brand', 'mfr', 'maker'],
  certNo: ['certificate', 'cert', 'cert no', 'certificate no', 'certificate number', 'test cert', 'test certificate', 'test cert no', 'cert number'],
  location: ['location', 'kept at', 'area', 'where kept', 'where it is kept', 'store', 'storage', 'bay'],
  std: ['standard', 'as', 'standard reference', 'australian standard', 'std'],
  extra: ['length', 'size', 'diameter', 'dia', 'legs', 'no of legs', 'number of legs', 'grade', 'reach', 'lift', 'height of lift']
};
/* columns that are never register fields (this app's own export carries the result columns) */
const IMPORT_SKIP = ['result', 'results', 'defects', 'defect', 'action taken', 'actions', 'proof load', 'proof', 'notes', 'note', 'next due', 'due', 'date', 'status', 'photo', 'photos', 'comment', 'comments', 'colour', 'color'];
const IMPORT_SINGLE = ['ident', 'type', 'wll', 'unit', 'make', 'certNo', 'location', 'std'];
const importNormHead = s => String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9 \/]+/g, ' ').replace(/\s+/g, ' ').trim();
const IMPORT_EXACT = (() => { const m = new Map(); Object.keys(IMPORT_SYN).forEach(t => IMPORT_SYN[t].forEach(p => { if (!m.has(p)) m.set(p, t); })); return m; })();
const IMPORT_PHRASES = (() => { const a = []; Object.keys(IMPORT_SYN).forEach(t => IMPORT_SYN[t].forEach(p => { if (p !== 'as' && p !== 'sn') a.push({ p, t }); })); return a; })();
function importHeadLookup(h) {
  if (IMPORT_EXACT.has(h)) return IMPORT_EXACT.get(h);
  const pad = ' ' + h + ' ';
  if (IMPORT_SKIP.some(p => pad.includes(' ' + p + ' '))) return 'skip';
  let best = null, bestEnd = -1, bestLen = 0;
  IMPORT_PHRASES.forEach(({ p, t }) => {
    const i = pad.indexOf(' ' + p + ' '); if (i < 0) return;
    const end = i + p.length + 1;    /* the right-most match is the head noun: "asset description" is a description */
    if (end > bestEnd || (end === bestEnd && p.length > bestLen)) { best = t; bestEnd = end; bestLen = p.length; }
  });
  return best;
}
/* -> { target, unit } or null (no synonym matched). Pulls a unit out of 'WLL (t)', 'SWL kg', 'WLL tonnes'. */
function importClassify(raw) {
  const h = importNormHead(raw); if (!h) return null;
  let m = /[(\[]\s*([A-Za-z]+)\s*[)\]]/.exec(String(raw));
  if (m && unitWord(m[1]) && importHeadLookup(importNormHead(String(raw).replace(m[0], ' '))) === 'wll') return { target: 'wll', unit: unitWord(m[1]) };
  m = /^(.*\S)\s+(t|tonnes?|tons?|kgs?|kilos?|kilograms?)$/.exec(h);
  if (m && importHeadLookup(m[1]) === 'wll') return { target: 'wll', unit: unitWord(m[2]) };
  const t = importHeadLookup(h);
  return t ? { target: t, unit: '' } : null;
}
/* the header row: best score of synonym matches in the first 20 rows (earliest on ties), else the first row with 2+ cells */
function findHeaderRow(rows) {
  let best = -1, bestScore = 0, firstTwo = -1, firstAny = -1;
  for (let i = 0; i < Math.min(20, rows.length); i++) {
    const cells = rows[i].map(importCell).filter(Boolean);
    if (!cells.length) continue;
    if (firstAny < 0) firstAny = i;
    if (cells.length < 2) continue;
    if (firstTwo < 0) firstTwo = i;
    const score = cells.filter(c => c.length <= 30 && importNormHead(c).split(' ').length <= 4).filter(c => { const r = importClassify(c); return r && r.target !== 'skip'; }).length;
    if (score > bestScore) { best = i; bestScore = score; }
  }
  return best >= 0 ? best : firstTwo >= 0 ? firstTwo : Math.max(firstAny, 0);
}
/* one entry per column: { header, target, unitHint, samples } */
function matchColumns(headerCells, dataRows) {
  const width = Math.max(headerCells.length, ...dataRows.map(r => r.length), 0);
  const used = {}, out = [];
  for (let k = 0; k < width; k++) {
    const header = importCell(headerCells[k]), vals = dataRows.map(r => importCell(r[k])).filter(Boolean);
    const c = importClassify(header);
    let target = c ? c.target : 'skip', unitHint = c && c.target === 'wll' ? c.unit : '';
    /* a column of 1, 2, 3 ... is a row number, whatever its header says */
    if ((target === 'desc' || target === 'extra') && vals.length >= 2 && vals.every((v, i) => v === String(i + 1))) target = 'skip';
    if (IMPORT_SINGLE.includes(target)) { if (used[target]) target = 'skip'; else used[target] = true; }
    if (target !== 'wll') unitHint = '';
    out.push({ header, target, unitHint, samples: vals.slice(0, 3) });
  }
  return out;
}
/* true when the inspector must say t or kg: a WLL column of bare numbers, no unit column, no unit in the header */
function unitChoiceNeeded(cols, dataRows) {
  const w = cols.findIndex(c => c.target === 'wll');
  if (w < 0 || cols.some(c => c.target === 'unit') || cols[w].unitHint) return false;
  return dataRows.some(r => /^[\d.,\s]+$/.test(importCell(r[w])) && /\d/.test(importCell(r[w])));
}

/* ---- WLL: value and unit are kept as written, never converted between kg and t ---- */
function unitWord(w) { w = String(w == null ? '' : w).trim().toLowerCase(); return /^(t|tonnes?|tons?)$/.test(w) ? 't' : /^(kgs?|kilos?|kilograms?)$/.test(w) ? 'kg' : ''; }
/* '1,000' is a thousand, '2,5' is two and a half; null when it is not a number */
function importNum(s) {
  s = String(s).trim(); if (!/^\d[\d.,]*$/.test(s)) return null;
  const hasC = s.includes(','), hasD = s.includes('.'); let v;
  if (hasC && hasD) {
    const dec = s.lastIndexOf(',') > s.lastIndexOf('.') ? ',' : '.', th = dec === ',' ? '.' : ',';
    if (s.split(dec).length > 2) return null;
    v = s.split(th).join('').replace(dec, '.');
  } else if (hasC) {
    if (/^[1-9]\d{0,2}(,\d{3})+$/.test(s)) v = s.replace(/,/g, '');
    else if (s.split(',').length === 2) v = s.replace(',', '.');
    else return null;
  } else { if (s.split('.').length > 2) return null; v = s; }
  return /^\d+(\.\d+)?$/.test(v) ? { v, comma: hasC } : null;
}
/* -> { wll, unit, ok, note }; note is set when the figure needs a second look; unit is '' for a bare number with no unit given */
function parseWllCell(text, unit) {
  const raw = importCell(text), bad = { wll: '', unit: '', ok: false, note: 'not understood' };
  const m = /^(?:(?:wll|swl|capacity|rated(?:\s+capacity)?)\s*[:=]?\s*)?(\d[\d.,]*)\s*([A-Za-z]*)\.?$/i.exec(raw);
  if (!m) return bad;
  const n = importNum(m[1]); if (!n) return bad;
  let u = '';
  if (m[2]) { u = unitWord(m[2]); if (!u) return bad; } else u = unit === 't' || unit === 'kg' ? unit : '';
  const val = parseFloat(n.v), notes = [];
  if (n.comma) notes.push('comma in the figure');
  if (u === 't' && val > 100) notes.push('over 100 t');
  if (u === 'kg' && val < 1) notes.push('under 1 kg');
  if (val === 0) notes.push('zero');
  return { wll: n.v, unit: u, ok: true, note: notes.join(', ') };
}
/* a WLL inside free text: labelled form first, else a number straight before a t or kg word.
   null when none; { wll:'', note } when several different loads and no label; else { wll, unit ('' if labelled without a unit), token, note } */
function findWllInText(text) {
  const s = String(text == null ? '' : text), U = '(t|tonnes?|tons?|kgs?|kilos?|kilograms?)', N = '(\\d+(?:[.,]\\d+)?)';
  const lab = new RegExp('(?:^|[^A-Za-z0-9])((?:wll|swl|rated\\s+capacity|capacity|cap|rated)\\s*[:=]?\\s*' + N + '(?:\\s*' + U + '(?![A-Za-z0-9(])|(?![A-Za-z0-9.,])))', 'i').exec(s);
  if (lab) { const r = parseWllCell(lab[2] + (lab[3] || ''), ''); if (r.ok) return { wll: r.wll, unit: r.unit, token: lab[1], note: r.note }; }
  const re = new RegExp('(?:^|[^A-Za-z0-9.])(' + N + '\\s*' + U + ')(?![A-Za-z0-9(])', 'gi'), found = []; let m;
  while ((m = re.exec(s))) { const r = parseWllCell(m[2] + m[3], ''); if (r.ok) found.push({ wll: r.wll, unit: r.unit, token: m[1], note: r.note }); re.lastIndex = m.index + m[0].length - 1; }
  if (!found.length) return null;
  if (new Set(found.map(f => f.wll + '|' + f.unit)).size > 1) return { wll: '', unit: '', token: '', note: 'more than one load in the description' };
  return found[0];
}

/* ---- type ---- */
const IMPORT_TYPE_KW = [
  ['hoist', ['chain block', 'lever hoist', 'lever block', 'chain hoist', 'hand hoist', 'ratchet hoist', 'come along', 'come-along', 'pull lift', 'chain fall', 'block and tackle']],
  ['clamp', ['beam clamp', 'girder clamp', 'beam trolley', 'push trolley', 'geared trolley', 'trolley']],
  ['beam', ['spreader beam', 'spreader bar', 'spreader', 'lifting beam', 'lifting frame']],
  ['harness', ['harness']],
  ['lanyard', ['lanyard', 'inertia reel', 'self retracting', 'self-retracting', 'srl', 'fall arrest block']],
  ['round', ['round sling', 'roundsling', 'endless sling']],
  ['web', ['flat webbing sling', 'webbing sling', 'flat sling', 'webbing', 'web sling', 'flat web', 'synthetic sling']],
  ['wire', ['steel wire rope sling', 'wire rope sling', 'wire sling', 'wire rope', 'wrs', 'steel wire rope', 'flexible steel wire']],
  ['chain', ['chain sling', 'chain']],
  ['shackle', ['shackle', 'dee shackle', 'd shackle']],
  ['eyebolt', ['eyebolt', 'eye bolt', 'eye nut', 'eyenut', 'lifting point', 'swivel eye', 'rotating eye', 'lifting eye']],
  ['hook', ['hook', 'master link', 'masterlink', 'master ring']]
].map(([id, ps]) => [id, ps.map(p => new RegExp('(?:^|[^a-z0-9])(' + p.split(/[\s-]+/).map(reEsc).join('[\\s-]+') + '(?:es|s)?)(?![a-z0-9])'))]);
/* -> { type, phrase } or null; 'bow' counts as a shackle only when nothing else matched */
function inferTypeMatch(text) {
  const s = String(text == null ? '' : text).toLowerCase();
  for (const [id, res] of IMPORT_TYPE_KW) for (const re of res) { const m = re.exec(s); if (m) return { type: id, phrase: m[1] }; }
  const b = /(?:^|[^a-z0-9])(bow)(?![a-z0-9])/.exec(s);
  return b ? { type: 'shackle', phrase: 'bow' } : null;
}
const inferType = text => { const m = inferTypeMatch(text); return m ? m.type : ''; };
/* a Type column value: type id, name, a part of the name, a plural phrase, then the keyword rules */
function matchTypeCell(text) {
  const s = importNormHead(text).replace(/\//g, ' ').replace(/\s+/g, ' ').trim(); if (!s) return '';
  const sing = s.replace(/s$/, '');
  for (const t of TYPES) {
    const names = [t.id, t.name.toLowerCase()].concat(t.name.toLowerCase().split(' or '), (TYPE_PLURALS[t.id] || '').split(/ and |, /));
    if (names.some(n => n && (n === s || n.replace(/s$/, '') === sing))) return t.id;
  }
  return inferType(s);
}

/* ---- description, serial ---- */
const IMPORT_ID_LABEL = '(?:SN|S\\/N|S\\.N\\.?|Serial(?:\\s*(?:No|Number)\\.?)?|ID|Tag(?:\\s*No\\.?)?|Asset(?:\\s*No\\.?)?)';
/* The description in the app's style. used = { wll, ident, type }: the tokens that were read out of this text and now live in their own fields. */
function describe(text, used) {
  used = used || {};
  let s = ' ' + String(text == null ? '' : text) + ' ';
  const cut = re => { s = s.replace(re, ' '); };
  if (used.wll) cut(new RegExp(reEsc(used.wll), 'i'));
  if (used.ident) cut(new RegExp('(?:\\b' + IMPORT_ID_LABEL + '\\s*[:#.]?\\s*)?' + reEsc(used.ident), 'i'));
  if (used.type) { if (/shackle/i.test(used.type)) cut(/shackles?/i); else if (used.type.toLowerCase() !== 'bow') cut(new RegExp(reEsc(used.type), 'i')); }
  let legs = '', dia = '', grade = '', len = '';
  s = s.replace(/(^|[^\d.])(\d)\s*-?\s*legs?(?![A-Za-z])/i, (m, a, n) => { legs = n + '-leg'; return a + ' '; });
  s = s.replace(/(^|[\s,;(x])(\d+(?:\.\d+)?)\s*mm(?![A-Za-z0-9])/i, (m, a, n) => { dia = n + ' mm'; return a + ' '; });
  s = s.replace(/(^|[^A-Za-z0-9])((?:grade|gr|g)\s*-?\s*80|grade\s*t(?:\s*\(?\s*80\s*\)?)?|t\s*\(\s*80\s*\)|t80)(?![A-Za-z0-9])/i, (m, a) => { grade = 'Grade T(80)'; return a + ' '; });
  if (!grade) s = s.replace(/(^|[^A-Za-z0-9])((?:grade|gr|g)\s*-?\s*100|grade\s*v(?:\s*\(?\s*100\s*\)?)?|v\s*\(\s*100\s*\)|v100)(?![A-Za-z0-9])/i, (m, a) => { grade = 'Grade V(100)'; return a + ' '; });
  s = s.replace(/(^|[\s,;(x])(\d+(?:\.\d+)?)\s*(?:m|mtrs?|metres?|meters?)(?![A-Za-z0-9])(?!\s*lift)/i, (m, a, n) => { len = n + ' m'; return a + ' '; });
  s = s.replace(/(^|\s)x(?=\s|$)/gi, ' ').replace(/\b(?:swl|wll)\b\s*[:=]?/gi, ' ').replace(/\(\s*\)/g, ' ').replace(/\s+/g, ' ');
  s = s.replace(/(\s*[,;]\s*){2,}/g, ', ').replace(/^[\s,;:\-–\/.]+|[\s,;:\-–\/.]+$/g, '');
  const rem = s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  return [legs, rem, dia, grade, len].filter(Boolean).join(', ');
}
/* A serial in free text, used only when no column holds the ID. -> { ident, token } or null */
function findSerialInText(text) {
  const s = String(text == null ? '' : text);
  const lab = new RegExp('\\b' + IMPORT_ID_LABEL + '\\s*[:#.]?\\s*([A-Z0-9][A-Z0-9\\-\\/]*\\d[A-Z0-9\\-\\/]*)', 'i').exec(s);
  if (lab) return { ident: lab[1], token: lab[1] };
  const skip = [/^\d+(\.\d+)?(t|kg|kgs|m|mm|tonnes?)$/i, /^(g|gr|t|v)\(?\d+\)?$/i, /^m\d+(x[\d.]+)?$/i, /^\d-?legs?$/i, /^\d+(\.\d+)?$/, /^\d+(\.\d+)?x\d+(\.\d+)?(mm|m)?$/i, /^\d+(\.\d+)?-\d+(\.\d+)?(mm|m)?$/i, /^(as|asnz|asnzs|en|iso|din)[\s\-]?\d/i];
  const seen = new Map();
  s.split(/[\s,;]+/).forEach(raw => {
    const t = raw.replace(/^[("']+/, '').replace(/[)"'.,:;]+$/, ''); if (!t || !/\d/.test(t)) return;
    if (!((/[A-Za-z]/.test(t) && /\d/.test(t)) || (t.includes('-') && /\d/.test(t)))) return;
    if (skip.some(re => re.test(t))) return;
    seen.set(t.toLowerCase(), t);
  });
  if (seen.size !== 1) return null;
  const id = [...seen.values()][0];
  return { ident: id, token: id };
}

/* ---- build, check, edit ---- */
const IMPORT_R = {
  wllText: 'WLL read from the description. Check it against the tag', wllFig: 'Check the WLL figure', wllUnit: 'Check the WLL unit',
  noWll: 'No WLL found', noId: 'No ID found', idText: 'ID read from the description', typeText: 'Type worked out from the description',
  typeNone: 'Type not found', dup: "Already on this client's register"
};
const importIsWllReason = r => r === IMPORT_R.wllText || r === IMPORT_R.wllFig || r === IMPORT_R.wllUnit || r.startsWith(IMPORT_R.noWll) || r.startsWith('WLL not understood');
const importIsTypeReason = r => r === IMPORT_R.typeText || r === IMPORT_R.typeNone || r.startsWith('Type not recognised');
/* duplicates against the client's register (retired included) and repeats within the file; sets status for every item.
   An item that turns into a duplicate is unticked, one that stops being a duplicate is ticked. */
function importIdentFlags(items, clientId) {
  const reg = new Map(), seen = new Map();
  S.assets.forEach(a => {
    if (a.clientId !== clientId) return;
    const k = String(a.ident || '').trim().toLowerCase(); if (!k) return;
    const o = reg.get(k); if (!o || (o.retired && !a.retired)) reg.set(k, a);
  });
  items.forEach(it => {
    const was = it.status === 'dup';
    it.reasons = it.reasons.filter(r => !r.startsWith(IMPORT_R.dup) && !r.startsWith('Same ID as row'));
    const k = String(it.ident || '').trim().toLowerCase(); let dup = false;
    if (k) {
      const o = reg.get(k);
      if (o) { dup = true; it.reasons.unshift(IMPORT_R.dup + (o.retired ? ' (retired)' : '')); }
      else if (seen.has(k)) it.reasons.push('Same ID as row ' + seen.get(k) + ' in this file');
      if (!seen.has(k)) seen.set(k, it.row);
    }
    if (dup && !was) it.on = false; else if (!dup && was) it.on = true;
    it.status = dup ? 'dup' : it.reasons.length ? 'check' : 'ready';
  });
}
/* One item per data row. Reads S.assets for duplicates; writes nothing. items.truncated is set when the file had more than 5000 rows. */
function buildImport({ rows, headerRow, cols, clientId, bareUnit }) {
  const idx = t => cols.findIndex(c => c.target === t), all = t => cols.map((c, k) => c.target === t ? k : -1).filter(k => k >= 0);
  const ix = {}; ['ident', 'type', 'wll', 'unit', 'make', 'certNo', 'location', 'std'].forEach(t => { ix[t] = idx(t); });
  const descIx = all('desc'), extraIx = all('extra'), items = [];
  let data = rows.map((r, i) => ({ r, n: i + 1 })).slice(headerRow + 1).filter(x => x.r.some(c => importCell(c) !== ''));
  const truncated = data.length > IMPORT_MAX_ROWS; data = data.slice(0, IMPORT_MAX_ROWS);
  data.forEach(({ r, n }) => {
    const cell = k => k >= 0 ? importCell(r[k]) : '';
    const reasons = [], src = { wllFromText: false, typeInferred: false, identFromText: false }, used = {};
    const descText = descIx.map(cell).filter(Boolean).join(' ');
    const extras = extraIx.map(k => ({ h: cols[k].header, v: cell(k) })).filter(x => x.v);
    const extraText = extras.map(x => x.v).join(' ');
    /* type */
    let type = '';
    const typeCell = cell(ix.type);
    if (typeCell) { type = matchTypeCell(typeCell); if (!type) { type = 'other'; reasons.push('Type not recognised: ' + typeCell); } }
    else {
      const m = inferTypeMatch(descText + ' ' + extraText);
      if (m) { type = m.type; src.typeInferred = true; reasons.push(IMPORT_R.typeText); if (new RegExp(reEsc(m.phrase), 'i').test(descText)) used.type = m.phrase; }
      else { type = 'other'; reasons.push(IMPORT_R.typeNone); }
    }
    const t = typeById(type);
    /* WLL: harnesses and lanyards carry none */
    let wll = '', wllUnit = 't';
    if (t.wll) {
      const wcell = cell(ix.wll);
      if (wcell) {
        const ucRaw = cell(ix.unit), uc = unitWord(ucRaw);
        const p = parseWllCell(wcell, uc || (ix.wll >= 0 ? cols[ix.wll].unitHint : '') || bareUnit || '');
        if (!p.ok) reasons.push('WLL not understood: ' + wcell);
        else {
          wll = p.wll; wllUnit = p.unit || 't';
          if (p.note) reasons.push(IMPORT_R.wllFig);
          if (!p.unit) reasons.push(IMPORT_R.wllUnit);
          if (ucRaw && !uc && !/[A-Za-z]/.test(wcell)) reasons.push('WLL unit not understood: ' + ucRaw);
        }
      } else {
        const f = findWllInText(descText);
        if (f && f.wll) {
          wll = f.wll; wllUnit = f.unit || bareUnit || 't'; src.wllFromText = true; used.wll = f.token;
          reasons.push(IMPORT_R.wllText);
          if (f.note) reasons.push(IMPORT_R.wllFig);
          if (!f.unit && !bareUnit) reasons.push(IMPORT_R.wllUnit);
        } else reasons.push(IMPORT_R.noWll + (f && f.note ? ': ' + f.note : ''));
      }
    }
    /* ID */
    let ident = cell(ix.ident);
    if (ix.ident < 0) {
      const f = findSerialInText(descText);
      if (f) { ident = f.ident; src.identFromText = true; used.ident = f.token; reasons.push(IMPORT_R.idText); }
    }
    if (!ident) reasons.push(IMPORT_R.noId);
    /* description: as written unless something was lifted out of it */
    let desc = descText;
    if (used.wll || used.ident || used.type) desc = describe(descText, used);
    desc = [desc].concat(extras.map(x => /^\d+([.,]\d+)?$/.test(x.v) ? (x.h.charAt(0).toUpperCase() + x.h.slice(1) + ' ' + x.v).trim() : x.v)).filter(Boolean).join(', ');
    items.push({ row: n, on: true, status: 'ready', reasons, ident, type, wll, wllUnit, desc, make: cell(ix.make), certNo: cell(ix.certNo), location: cell(ix.location), std: cell(ix.std) || t.std, src });
  });
  importIdentFlags(items, clientId);
  if (truncated) items.truncated = true;
  return items;
}
/* After an inline edit of 'ident', 'type', 'wll' or 'wllUnit': mutates the item and re-derives the status of every item. */
function editImportItem(items, index, field, value, clientId) {
  const it = items[index]; if (!it) return;
  const noWll = () => { it.reasons = it.reasons.filter(r => !r.startsWith(IMPORT_R.noWll)); if (typeById(it.type).wll && !String(it.wll).trim()) it.reasons.push(IMPORT_R.noWll); };
  if (field === 'ident') {
    it.ident = String(value == null ? '' : value).trim(); it.src.identFromText = false;
    it.reasons = it.reasons.filter(r => r !== IMPORT_R.idText && r !== IMPORT_R.noId);
    if (!it.ident) it.reasons.push(IMPORT_R.noId);
  } else if (field === 'type') {
    const oldStd = typeById(it.type).std;
    it.type = value; it.src.typeInferred = false;
    it.reasons = it.reasons.filter(r => !importIsTypeReason(r));
    if (it.std === oldStd) it.std = typeById(value).std;
    noWll();
  } else if (field === 'wll') {
    it.wll = normWll(value); it.src.wllFromText = false;
    it.reasons = it.reasons.filter(r => !importIsWllReason(r));
    if (!it.wll) noWll(); else if (!wllIsNumber(it.wll)) it.reasons.push('WLL not understood: ' + it.wll);
  } else if (field === 'wllUnit') {
    it.wllUnit = value === 'kg' ? 'kg' : 't';
    it.reasons = it.reasons.filter(r => r !== IMPORT_R.wllUnit && !r.startsWith('WLL unit not understood'));
  }
  importIdentFlags(items, clientId);
}
/* e.g. '38 ready, 6 to check, 2 duplicates, 3 skipped'; toImport is the number of ticked items */
function importSummary(items) {
  let ready = 0, check = 0, dup = 0, skipped = 0, toImport = 0;
  items.forEach(i => {
    if (i.on) toImport++;
    if (i.status === 'dup') dup++;
    else if (!i.on) skipped++;
    else if (i.status === 'ready') ready++;
    else check++;
  });
  const parts = [ready + ' ready'];
  if (check) parts.push(check + ' to check');
  if (dup) parts.push(dup + (dup === 1 ? ' duplicate' : ' duplicates'));
  if (skipped) parts.push(skipped + ' skipped');
  return { ready, check, dup, skipped, toImport, text: parts.join(', ') };
}
/* The only function here that writes: ticked items become register items. target = { clientId } or { newClient: { name, site } }.
   Nothing is added to an open visit. One save(). -> { clientId, count } */
function commitImport(items, target) {
  const ticked = items.filter(i => i.on);
  let clientId = target.clientId;
  if (!target.newClient && !client(clientId)) throw new Error('Choose a client for these items.');
  if (!ticked.length) return { clientId: clientId || '', count: 0 };
  if (target.newClient) {
    const c = { id: 'c' + uid(), name: String(target.newClient.name || '').trim(), site: String(target.newClient.site || '').trim(), contact: '', email: '', phone: '' };
    S.clients.push(c); clientId = c.id;
  }
  ticked.forEach(it => {
    const a = newAsset(clientId, it.type);
    Object.assign(a, { ident: it.ident, wll: normWll(it.wll), wllUnit: it.wllUnit === 'kg' ? 'kg' : 't', make: it.make, certNo: it.certNo, desc: it.desc, location: it.location, std: it.std });
  });
  save();
  return { clientId, count: ticked.length };
}
